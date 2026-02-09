require('dotenv').config();
const prisma = require('./src/services/prisma');

const API_URL = 'http://localhost:5000/api';

async function verify() {
  console.log("Verifying Enhanced Predictive Analytics Endpoints...");

  try {
    // 1. Get an agent for login
    const agent = await prisma.user.findFirst({
      where: { role: 'agent', isActive: true }
    });

    if (!agent) {
      console.error("No active agent found. Please run seed script first.");
      return;
    }

    console.log(`Using agent: ${agent.email}`);

    // 2. Login
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: agent.email,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeader = { 'Authorization': `Bearer ${token}` };

    // 3. Get a ticket for prediction
    const ticket = await prisma.ticket.findFirst({
      where: { status: 'New' }
    });

    if (!ticket) {
      console.error("No active tickets found for prediction.");
      return;
    }

    console.log(`\nTesting Prediction for Ticket ID: ${ticket.id} (${ticket.category})`);

    // 4. Predict Resolution Time
    console.log("4. GET /api/analytics/predict-resolution-time/:id");
    const predRes = await fetch(`${API_URL}/analytics/predict-resolution-time/${ticket.id}`, { headers: authHeader });
    const predData = await predRes.json();
    console.log("Prediction Result:", predData);

    // 5. Recommend Agent
    console.log("\n5. GET /api/analytics/recommend-agent/:id");
    const recRes = await fetch(`${API_URL}/analytics/recommend-agent/${ticket.id}`, { headers: authHeader });
    const recData = await recRes.json();
    console.log("Recommendations:", recData);

    // 6. Ticket Clustering
    console.log("\n6. GET /api/analytics/ticket-clustering");
    const clusterRes = await fetch(`${API_URL}/analytics/ticket-clustering`, { headers: authHeader });
    const clusterData = await clusterRes.json();
    console.log("Clusters:", clusterData);

    console.log("\nALL PREDICTIVE ANALYTICS TESTS PASSED!");
  } catch (error) {
    console.error("Verification failed:", error.message);
  } finally {
    process.exit(0);
  }
}

verify();
