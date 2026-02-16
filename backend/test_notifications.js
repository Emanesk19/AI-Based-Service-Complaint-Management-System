require('dotenv').config();
const API_URL = 'http://localhost:5000/api';

async function verify() {
  console.log("Verifying Phase 2: Notifications & Configuration...");
  const myFetch = typeof fetch === 'function' ? fetch : globalThis.fetch;

  try {
    const timestamp = Date.now();
    const adminEmail = `admin.phase2.${timestamp}@test.com`;
    const userEmail = `user.phase2.${timestamp}@test.com`;

    // 1. Register Admin & User
    console.log("1. Registering Users...");
    await myFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Admin2", email: adminEmail, password: "password123", role: "admin" })
    });
    
    const userRegRes = await myFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "User2", email: userEmail, password: "password123", role: "user" })
    });
    const userRegData = await userRegRes.json();
    const userId = userRegData.user.id;

    // 2. Login
    console.log("2. Logging in...");
    const adminLoginRes = await myFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: "password123" })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    const adminHeader = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    const userLoginRes = await myFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: "password123" })
    });
    const userLoginData = await userLoginRes.json();
    const userToken = userLoginData.token;
    const userHeader = { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' };

    // 3. Verify Dynamic Config
    console.log("\n3. Verifying Dynamic Config...");
    const catRes = await myFetch(`${API_URL}/config/categories`, { headers: userHeader });
    const categories = await catRes.json();
    console.log(`Found ${categories.length} categories: ${categories.map(c => c.name).join(", ")}`);

    const prioRes = await myFetch(`${API_URL}/config/priorities`, { headers: userHeader });
    const priorities = await prioRes.json();
    console.log(`Found ${priorities.length} priorities: ${priorities.map(p => p.name).join(", ")}`);

    // 4. Create Ticket & Check Notifications
    console.log("\n4. Creating Ticket & Checking Notifications...");
    const ticketRes = await myFetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: userHeader,
      body: JSON.stringify({
        title: "Notification Test Ticket",
        description: "Testing status alerts",
        category: "Software",
        priority: "High"
      })
    });
    const ticketData = await ticketRes.json();
    const ticketId = ticketData.ticket.id;

    // 5. Assign Ticket (should notify user and agent)
    console.log("5. Assigning Ticket...");
    await myFetch(`${API_URL}/tickets/assign`, {
      method: 'POST',
      headers: adminHeader,
      body: JSON.stringify({ ticketId, agentId: userId }) // Assign back to user for easy check
    });

    // 6. Check User Notifications
    console.log("\n6. GET /api/notifications");
    const notifyRes = await myFetch(`${API_URL}/notifications`, { headers: userHeader });
    const notifications = await notifyRes.json();
    console.log(`Target User has ${notifications.length} notifications.`);
    notifications.forEach(n => console.log(`- [${n.type}] ${n.title}: ${n.message}`));

    if (notifications.some(n => n.type === 'TICKET_ASSIGNED')) {
      console.log("\nPHASE 2 TESTS PASSED!");
    } else {
      console.error("\nFAIL: TICKET_ASSIGNED notification not found.");
    }

  } catch (error) {
    console.error("Verification failed:", error.message);
  } finally {
    process.exit(0);
  }
}

verify();
