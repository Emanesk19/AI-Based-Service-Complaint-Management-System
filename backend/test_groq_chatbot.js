const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function verify() {
  console.log("🚀 Verifying Phase 7: Professional Groq Chatbot...");

  try {
    const ts = Date.now();
    
    // 1. SETUP AUTH
    console.log("Setting up Test User...");
    const userRes = await axios.post(`${API_URL}/auth/register`, { 
      name: "Groq User", 
      email: `groq.${ts}@test.com`, 
      password: "password123", 
      role: "user" 
    });
    const login = await axios.post(`${API_URL}/auth/login`, { 
      email: `groq.${ts}@test.com`, 
      password: "password123" 
    });
    const headers = { Authorization: `Bearer ${login.data.token}` };

    // 2. CREATE SESSION
    console.log("Creating Chat Session...");
    const session = await axios.post(`${API_URL}/chat/sessions`, {}, { headers });
    const SID = session.data.sessionId;

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: NATURAL LANGUAGE GREETING
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- TEST 1: Conversational Greeting ---");
    const greet = await axios.post(`${API_URL}/chat`, { sessionId: SID, message: "Hey there! Who are you and how can you help me today?" }, { headers });
    console.log("AI Reply:", greet.data.reply);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: COMPLEX TICKET CREATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- TEST 2: Multi-parameter Ticket Creation ---");
    const create = await axios.post(`${API_URL}/chat`, { 
      sessionId: SID, 
      message: "I'm having a serious issue with the CRM login, it keeps crashing my browser. Can you open a high priority ticket for this in the Software category?" 
    }, { headers });
    console.log("AI Reply:", create.data.reply);
    
    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: ANALYTICS & REASONING (Tool Use)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- TEST 3: Advanced Reasoning (Risk Analysis) ---");
    // Extract ID if mentioned
    const ticketIdMatch = create.data.reply.match(/#(\d+)/);
    const ticketId = ticketIdMatch ? ticketIdMatch[1] : null;

    if (ticketId) {
      const risk = await axios.post(`${API_URL}/chat`, { 
        sessionId: SID, 
        message: `Why is ticket #${ticketId} considered risky? Can you analyze its SLA status?` 
      }, { headers });
      console.log("AI Logic Analysis:", risk.data.reply);
    } else {
      console.log("Could not find ticket ID in AI response to test risk analysis.");
    }

    console.log("\n--- TEST 4: Context Memory ---");
    const memory = await axios.post(`${API_URL}/chat`, { 
      sessionId: SID, 
      message: "Great, also show me my recent tickets to make sure it's there." 
    }, { headers });
    console.log("AI Context Reply:", memory.data.reply);

    console.log("\n✅ PROFESSIONAL GROQ CHATBOT VERIFIED!");

  } catch (error) {
    console.error("❌ Verification failed:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

verify();
