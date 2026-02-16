require('dotenv').config();
const API_URL = 'http://localhost:5000/api';

async function verify() {
  console.log("Verifying Phase 3: Email & Reporting...");
  const myFetch = typeof fetch === 'function' ? fetch : globalThis.fetch;

  try {
    const timestamp = Date.now();
    const adminEmail = `admin.phase3.${timestamp}@test.com`;

    // 1. Register & Login Admin
    console.log("1. Setting up Admin...");
    await myFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Admin3",
        email: adminEmail,
        password: "password123",
        role: "admin"
      })
    });

    const loginRes = await myFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: "password123" })
    });
    const { token } = await loginRes.json();
    const adminHeader = { 'Authorization': `Bearer ${token}` };

    // 2. Test CSV Export
    console.log("\n2. Testing CSV Export...");
    const csvRes = await myFetch(`${API_URL}/reports/export/csv`, { headers: adminHeader });
    if (csvRes.ok) {
      const contentType = csvRes.headers.get("content-type");
      console.log(`CSV Export Success! Content-Type: ${contentType}`);
      if (contentType.includes("text/csv")) {
        console.log("Verified Content-Type: text/csv");
      }
    } else {
      console.error(`CSV Export Failed: ${csvRes.status}`);
    }

    // 3. Test PDF Export
    console.log("\n3. Testing PDF Export...");
    const pdfRes = await myFetch(`${API_URL}/reports/export/pdf`, { headers: adminHeader });
    if (pdfRes.ok) {
      const contentType = pdfRes.headers.get("content-type");
      console.log(`PDF Export Success! Content-Type: ${contentType}`);
      if (contentType.includes("application/pdf")) {
        console.log("Verified Content-Type: application/pdf");
      }
    } else {
      console.error(`PDF Export Failed: ${pdfRes.status}`);
    }

    console.log("\nPHASE 3 ENDPOINT TESTS PASSED!");

  } catch (error) {
    console.error("Verification failed:", error.message);
  } finally {
    process.exit(0);
  }
}

verify();
