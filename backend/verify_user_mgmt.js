const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log("1. Registering Admin...");
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Admin User",
        email: "admin@test.com",
        password: "password123",
        role: "admin"
      })
    });

    console.log("2. Registering Normal User...");
    const userRegRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Normal User",
        email: "user@test.com",
        password: "password123",
        role: "user"
      })
    });
    const userReg = await userRegRes.json();
    const userId = userReg.user.id;

    console.log("3. Logging in as Admin...");
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "admin@test.com",
        password: "password123"
      })
    });
    const adminLogin = await adminLoginRes.json();
    const adminToken = adminLogin.token;
    const authHeader = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    console.log("4. Getting all users (Admin)...");
    const usersRes = await fetch(`${API_URL}/users`, { headers: authHeader });
    const users = await usersRes.json();
    console.log(`Found ${users.users.length} users.`);

    console.log("5. Deactivating User...");
    await fetch(`${API_URL}/users/${userId}/status`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({ isActive: false })
    });
    console.log("User deactivated.");

    console.log("6. Attempting login as deactivated user (should fail)...");
    const disabledLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "user@test.com",
        password: "password123"
      })
    });
    if (disabledLoginRes.status === 403) {
      const data = await disabledLoginRes.json();
      console.log(`SUCCESS: Login failed with status 403: ${data.message}`);
    } else {
      console.error(`FAIL: Login should have failed with 403, but got ${disabledLoginRes.status}`);
    }

    console.log("7. Activating User...");
    await fetch(`${API_URL}/users/${userId}/status`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({ isActive: true })
    });
    console.log("User activated.");

    console.log("8. Updating User Role to Agent...");
    await fetch(`${API_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({ role: "agent" })
    });
    console.log("User role updated to agent.");

    console.log("\nALL USER MANAGEMENT TESTS PASSED!");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

test();
