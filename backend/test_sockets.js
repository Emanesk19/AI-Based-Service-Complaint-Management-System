const { io } = require("socket.io-client");
const axios = require("axios");

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

async function verify() {
  console.log("Verifying Phase 5: Real-time Features (WebSockets)...");

  try {
    const timestamp = Date.now();
    const email = `socket.test.${timestamp}@test.com`;

    // 1. Setup User
    console.log("1. Setting up Test User...");
    await axios.post(`${API_URL}/auth/register`, {
      name: "Socket User",
      email,
      password: "password123",
      role: "user"
    });

    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email,
      password: "password123"
    });
    const { token, user } = loginRes.json ? await loginRes.json() : loginRes.data;
    const authHeader = { Authorization: `Bearer ${token}` };

    // 2. Connect via WebSockets
    console.log("2. Connecting to WebSocket Server...");
    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error("Socket verification timed out! No event received."));
      }, 10000);

      socket.on("connect", () => {
        console.log("Connected to WebSocket server as user", user.id);
        
        // 3. Trigger an action that emits a socket event
        // We'll add a comment to a ticket. 
        // First we need a ticket.
        console.log("3. Creating a test ticket...");
        axios.post(`${API_URL}/tickets`, {
          title: "Socket Test Ticket",
          description: "Testing real-time updates",
          category: "Technical Support",
          priority: "Medium"
        }, { headers: authHeader }).then(ticketRes => {
          const ticketId = ticketRes.data.ticket.id;
          console.log(`Ticket created: ${ticketId}. Listening for 'new_comment' event...`);

          // Listen for comment event
          socket.on("new_comment", (data) => {
            console.log("SUCCESS: Received 'new_comment' event:", data.comment.content);
            clearTimeout(timeout);
            socket.disconnect();
            resolve();
          });

          // Post a comment
          axios.post(`${API_URL}/comments`, {
            ticketId,
            content: "This is a real-time comment test!"
          }, { headers: authHeader });
        });
      });

      socket.on("connect_error", (err) => {
        console.error("Socket Connection Error:", err.message);
        clearTimeout(timeout);
        socket.disconnect();
        reject(err);
      });
    });

  } catch (error) {
    console.error("Verification failed:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

verify().then(() => {
  console.log("\nPHASE 5 SOCKET VERIFICATION PASSED!");
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
