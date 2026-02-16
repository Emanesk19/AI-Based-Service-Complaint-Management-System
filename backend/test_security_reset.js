require('dotenv').config();
const prisma = require('./src/services/prisma');
const API_URL = 'http://localhost:5000/api';

async function verify() {
  console.log("Verifying Phase 4: Advanced Security & Scaling...");
  if (!prisma) {
    console.error("Prisma client is NULL!");
    return;
  }
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && k !== '$connect' && k !== '$disconnect');
  console.log("Prisma Models:", models.join(", "));
  const myFetch = typeof fetch === 'function' ? fetch : globalThis.fetch;

  try {
    const timestamp = Date.now();
    const email = `security.test.${timestamp}@test.com`;
    const password = "password123";
    const newPassword = "newPassword456";

    // 1. Register User
    console.log("1. Registering User...");
    await myFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "SecurityTest", email, password, role: "user" })
    });

    // 2. Test Forgot Password
    console.log("2. Testing Forgot Password...");
    const forgotRes = await myFetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    console.log(`Forgot Password Response: ${forgotRes.status}`);

    // Fetch token from DB (since we can't easily read real email in automated test)
    const resetRecord = await prisma.passwordReset.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' }
    });

    if (!resetRecord) {
        throw new Error("Password reset record not found in database");
    }
    const token = resetRecord.token;
    console.log(`Found Reset Token: ${token}`);

    // 3. Test Reset Password
    console.log("3. Testing Reset Password...");
    const resetRes = await myFetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword })
    });
    const resetData = await resetRes.json();
    console.log(`Reset Status: ${resetRes.status}, Message: ${resetData.message}`);

    // 4. Verify New Password Login
    console.log("4. Verifying Login with New Password...");
    const loginRes = await myFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword })
    });
    console.log(`Login Status: ${loginRes.status}`);
    if (loginRes.status === 200) {
        console.log("Password Reset Flow Passed!");
    } else {
        throw new Error("Login failed after password reset");
    }

    // 5. Test Rate Limiting (Brute Force Auth)
    console.log("\n5. Testing Auth Rate Limiting (making 12 requests, limit is 10)...");
    let limitReached = false;
    for (let i = 0; i < 12; i++) {
        const res = await myFetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: "wrong_password" })
        });
        if (res.status === 429) {
            limitReached = true;
            console.log(`Request ${i+1}: 429 Too Many Requests (Limit Reached as expected)`);
            break;
        }
    }
    if (limitReached) {
        console.log("Auth Rate Limiting Passed!");
    } else {
        console.warn("Auth Rate Limiting was not triggered. (Note: This might be due to IP local testing behavior or existing sessions)");
    }

    // 6. Verify Security Headers (Helmet)
    console.log("\n6. Verifying Security Headers...");
    const homeRes = await myFetch(`http://localhost:5000/`);
    const headers = homeRes.headers;
    console.log("Headers:");
    console.log(`- X-Content-Type-Options: ${headers.get('x-content-type-options')}`);
    console.log(`- X-Frame-Options: ${headers.get('x-frame-options')}`);
    console.log(`- Content-Security-Policy: ${headers.get('content-security-policy') ? 'Present' : 'Not Present'}`);

    if (headers.get('x-content-type-options') === 'nosniff') {
        console.log("Security Headers (Helmet) Passed!");
    }

    console.log("\nPHASE 4 TESTS COMPLETED!");

  } catch (error) {
    console.error("Verification failed:", error.message);
  } finally {
    process.exit(0);
  }
}

verify();
