const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function verifyAutopilot() {
  console.log("🚀 Verifying Phase 9: AI Auto-Pilot Behavior...");

  try {
    const ts = Date.now();
    
    // 1. SETUP AUTH
    console.log("Registering test user...");
    const userRes = await axios.post(`${API_URL}/auth/register`, { 
      name: "Pilot User", 
      email: `pilot.${ts}@test.com`, 
      password: "password123", 
      role: "user" 
    });
    const login = await axios.post(`${API_URL}/auth/login`, { 
      email: `pilot.${ts}@test.com`, 
      password: "password123" 
    });
    const headers = { Authorization: `Bearer ${login.data.token}` };

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: VAGUE BUT CRITICAL TICKET (Hardware + High Priority)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- TEST 1: Vague Hardware Issue ---");
    const res1 = await axios.post(`${API_URL}/tickets`, { 
      title: "My laptop monitor is smoking", 
      description: "It actually smells like something is burning inside the screen and the display is flickering colors I've never seen before. I need this for my presentation in 2 hours!!" 
      // Note: No category or priority provided
    }, { headers });

    const t1 = res1.data.ticket;
    console.log("AI Categorization:", t1.category); // Expected: Hardware
    console.log("AI Priority:", t1.priority);       // Expected: High
    console.log("AI Sentiment:", t1.metadata.sentiment);
    console.log("AI Smart Reply Suggestion:", t1.metadata.aiSuggestedReply);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: ANGRY BILLING TICKET (Billing + High Priority Sentiment Override)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- TEST 2: Angry Billing Issue ---");
    const res2 = await axios.post(`${API_URL}/tickets`, { 
      title: "EXTREMELY UPSET ABOUT DOUBLE CHARGE", 
      description: "YOU CHARGED ME TWICE FOR THE PREMIUM SUBSCRIPTION AND NO ONE IS ANSWERING THE HELP LINE. FIX THIS NOW OR I AM CANCELING AND DISPUTING WITH MY BANK!!!" 
    }, { headers });

    const t2 = res2.data.ticket;
    console.log("AI Categorization:", t2.category); // Expected: Billing
    console.log("AI Sentiment:", t2.metadata.sentiment);
    console.log("Is User Angry?:", t2.metadata.isAngry ? "YES 🔥" : "No");

    console.log("\n✅ AI AUTO-PILOT VERIFIED!");

  } catch (error) {
    console.error("❌ Verification failed:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

verifyAutopilot();
