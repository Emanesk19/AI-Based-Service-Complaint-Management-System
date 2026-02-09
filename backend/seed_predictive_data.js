require('dotenv').config();
const prisma = require('./src/services/prisma');

async function seed() {
  console.log("Seeding data for predictive analytics testing (Using Adapter)...");

  try {
    const timestamp = Date.now();
    
    // 1. Create agent
    const agent = await prisma.user.create({
      data: {
        name: 'Agent Predictive',
        email: `agent.pred.${timestamp}@test.com`,
        password: 'password123',
        role: 'agent',
        isActive: true
      }
    });
    console.log("Created agent.");

    // 2. Create user
    const user = await prisma.user.create({
      data: {
        name: 'Test User Pred',
        email: `user.pred.${timestamp}@test.com`,
        password: 'password123',
        role: 'user',
        isActive: true
      }
    });
    console.log("Created user.");

    // 3. Create historical resolved tickets for Category "Software"
    // Ticket 1: 5 hours resolution
    await prisma.ticket.create({
      data: {
        title: 'Fix software bug A',
        description: 'Detail A',
        category: 'Software',
        priority: 'High',
        status: 'Resolved',
        userId: user.id,
        agentId: agent.id,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
        closedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),   // 5 hours ago
      }
    });

    // Ticket 2: 3 hours resolution
    await prisma.ticket.create({
      data: {
        title: 'Fix software bug B',
        description: 'Detail B',
        category: 'Software',
        priority: 'High',
        status: 'Resolved',
        userId: user.id,
        agentId: agent.id,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      }
    });
    console.log("Created resolved tickets.");

    // 4. Create active ticket for testing
    const currentTicket = await prisma.ticket.create({
      data: {
        title: 'Software installation issue',
        description: 'Need help installing IDE',
        category: 'Software',
        priority: 'High',
        status: 'New',
        userId: user.id
      }
    });
    console.log("Created active ticket.");

    console.log(`\nSUCCESS! Use Ticket ID: ${currentTicket.id} for testing.`);
  } catch (err) {
    console.error("SEED FAILED:");
    console.error(err);
  } finally {
    // Note: Don't disconnect here if we want to keep the pool for other scripts,
    // but for standalone it's fine.
    // However, the project's prisma instance might not expect standalone disconnect.
    process.exit(0);
  }
}

seed();
