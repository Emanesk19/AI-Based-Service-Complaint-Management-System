require('dotenv').config();
const prisma = require('./src/services/prisma');

const API_URL = 'http://localhost:5000/api';

async function verify() {
  console.log("Verifying Phase 1.5: Activity/Audit Logs...");
  
  if (typeof globalThis.fetch !== 'function') {
    console.error("FATAL: globalThis.fetch is not a function!");
    process.exit(1);
  }

  const myFetch = globalThis.fetch;

  try {
    const timestamp = Date.now();
    const adminEmail = `admin.audit.${timestamp}@test.com`;
    const userEmail = `user.audit.${timestamp}@test.com`;

    // 1. Register Admin
    console.log("1. Registering Admin...");
    let res = await myFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Admin Audit",
        email: adminEmail,
        password: "password123",
        role: "admin"
      })
    });
    if (!res.ok) throw new Error(`Admin registration failed: ${res.status}`);

    // 2. Register User
    console.log("2. Registering User...");
    res = await myFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "User Audit",
        email: userEmail,
        password: "password123",
        role: "user"
      })
    });
    if (!res.ok) throw new Error(`User registration failed: ${res.status}`);
    const userRegData = await res.json();
    const userId = userRegData.user.id;

    // 3. Login as Admin
    console.log("3. Logging in as Admin...");
    res = await myFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: "password123"
      })
    });
    if (!res.ok) throw new Error(`Admin login failed: ${res.status}`);
    const loginData = await res.json();
    const adminToken = loginData.token;
    const adminHeader = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    // 4. Create Ticket (as User)
    console.log("4. Creating Ticket...");
    res = await myFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: "password123"
      })
    });
    const userLoginData = await res.json();
    const userToken = userLoginData.token;
    const userHeader = { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' };

    res = await myFetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: userHeader,
      body: JSON.stringify({
        title: "Audit Test Ticket",
        description: "Testing history logging",
        category: "Software",
        priority: "High"
      })
    });
    if (!res.ok) throw new Error(`Ticket creation failed: ${res.status}`);
    const ticketData = await res.json();
    const ticketId = ticketData.ticket.id;
    console.log(`Ticket created: ID ${ticketId}`);

    // 5. Assign Ticket (as Admin)
    console.log("5. Assigning Ticket...");
    res = await myFetch(`${API_URL}/tickets/assign`, {
      method: 'POST',
      headers: adminHeader,
      body: JSON.stringify({ ticketId, agentId: userId })
    });
    if (!res.ok) throw new Error(`Assignment failed: ${res.status}`);

    // 6. Update Status (as Admin)
    console.log("6. Updating Status...");
    res = await myFetch(`${API_URL}/tickets/status`, {
      method: 'POST',
      headers: adminHeader,
      body: JSON.stringify({ ticketId, status: "In Progress" })
    });
    if (!res.ok) throw new Error(`Status update failed: ${res.status}`);

    // 7. Verify Ticket History
    console.log("\n7. GET /api/tickets/:id/history");
    res = await myFetch(`${API_URL}/tickets/${ticketId}/history`, { headers: adminHeader });
    const historyData = await res.json();
    console.log(`Found ${historyData.length} history entries.`);
    historyData.forEach(h => console.log(`- [${h.createdAt}] ${h.action}: ${h.oldValue || 'N/A'} -> ${h.newValue || 'N/A'} (by ${h.user.name})`));

    // 8. Verify Global Audit Logs
    console.log("\n8. GET /api/audit-logs");
    res = await myFetch(`${API_URL}/audit-logs`, { headers: adminHeader });
    const auditData = await res.json();
    console.log(`Total Audit Logs: ${auditData.pagination.total}`);
    
    const relevantLogs = auditData.logs.filter(l => l.ticketId === ticketId);
    if (relevantLogs.length >= 3) {
      console.log("\nALL AUDIT LOG TESTS PASSED!");
    } else {
      console.error(`\nFAIL: Expected at least 3 logs for ticket ${ticketId}, but found ${relevantLogs.length}`);
    }

  } catch (error) {
    console.error("Verification failed:", error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

verify();
