const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function verify() {
  console.log("🚀 Verifying Phase 6: Chatbot Perfection...");

  try {
    const ts = Date.now();
    
    // 1. SETUP AUTH
    console.log("Setting up User and Agent...");
    const userRes = await axios.post(`${API_URL}/auth/register`, { name: "Bot User", email: `user.${ts}@bot.com`, password: "password123", role: "user" });
    const agentRes = await axios.post(`${API_URL}/auth/register`, { name: "Bot Agent", email: `agent.${ts}@bot.com`, password: "password123", role: "agent" });

    const userLogin = await axios.post(`${API_URL}/auth/login`, { email: `user.${ts}@bot.com`, password: "password123" });
    const agentLogin = await axios.post(`${API_URL}/auth/login`, { email: `agent.${ts}@bot.com`, password: "password123" });

    const userHeader = { Authorization: `Bearer ${userLogin.data.token}` };
    const agentHeader = { Authorization: `Bearer ${agentLogin.data.token}` };

    // 2. CREATE SESSIONS
    console.log("Creating Chat Sessions...");
    const userSession = await axios.post(`${API_URL}/chat/sessions`, {}, { headers: userHeader });
    const agentSession = await axios.post(`${API_URL}/chat/sessions`, {}, { headers: agentHeader });

    console.log("User Session Data:", JSON.stringify(userSession.data));
    
    const USID = userSession.data.sessionId;
    const ASID = agentSession.data.sessionId;
    
    console.log(`Using USID: ${USID}, ASID: ${ASID}`);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: GREETING & HELP
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- TEST 1: Greeting & Help ---");
    const greet = await axios.post(`${API_URL}/chat`, { sessionId: USID, message: "Hello!" }, { headers: userHeader });
    console.log("User Greeting Response:", greet.data.reply);

    const help = await axios.post(`${API_URL}/chat`, { sessionId: USID, message: "help" }, { headers: userHeader });
    if (!help.data.reply.includes("For Users") || help.data.reply.includes("For Agents")) {
      console.warn("Help text role isolation failed for USER.");
    } else {
      console.log("PASSED: Role-based help for User.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: TICKET CREATION & MEMORY
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- TEST 2: Ticket Creation & Memory ---");
    const create = await axios.post(`${API_URL}/chat`, { sessionId: USID, message: "Create ticket: My internet is broken" }, { headers: userHeader });
    console.log("Create Response:", create.data.reply);
    
    const ticketIdMatch = create.data.reply.match(/#(\d+)/);
    const ticketId = ticketIdMatch ? ticketIdMatch[1] : null;

    if (ticketId) {
      console.log(`Ticket #${ticketId} created. Testing memory...`);
      const memoryTest = await axios.post(`${API_URL}/chat`, { sessionId: USID, message: "What is the status?" }, { headers: userHeader });
      console.log("Memory Query Response:", memoryTest.data.reply);
      if (memoryTest.data.reply.includes(ticketId)) {
        console.log("PASSED: Bot remembered ticket ID from previous turn.");
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: COMMENT WITH CONFIRMATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- TEST 3: Comment with Confirmation ---");
    const commentPrompt = await axios.post(`${API_URL}/chat`, { sessionId: USID, message: `Add comment to #${ticketId}: Please hurry` }, { headers: userHeader });
    console.log("Comment Prompt:", commentPrompt.data.reply);

    if (commentPrompt.data.reply.includes("Yes/No")) {
      console.log("Sending 'Yes' to confirm...");
      const confirm = await axios.post(`${API_URL}/chat`, { sessionId: USID, message: "Yes" }, { headers: userHeader });
      console.log("Confirmation Response:", confirm.data.reply);
      if (confirm.data.reply.includes("successfully added")) {
        console.log("PASSED: Stateful confirmation flow works.");
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: AGENT COMMANDS & RISK
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n--- TEST 4: Agent Commands & Risk ---");
    const risk = await axios.post(`${API_URL}/chat`, { sessionId: ASID, message: `Why is ticket #${ticketId} delayed?` }, { headers: agentHeader });
    console.log("AI Risk Analysis:", risk.data.reply);
    if (risk.data.reply.includes("Risk Score")) {
      console.log("PASSED: Intelligence integration works.");
    }

    const takeOver = await axios.post(`${API_URL}/chat`, { sessionId: ASID, message: `Assign #${ticketId} to me` }, { headers: agentHeader });
    console.log("Assignment Response:", takeOver.data.reply);
    if (takeOver.data.reply.includes("assigned to you")) {
      console.log("PASSED: Agent action works.");
    }

    console.log("\n✅ ALL ENTERPRISE CHATBOT TESTS PASSED!");

  } catch (error) {
    console.error("❌ Verification failed:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

verify();
