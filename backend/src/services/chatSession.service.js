const prisma = require("./prisma");

async function createSession(userId) {
  return prisma.chatSession.create({
    data: {
      user: { connect: { id: userId } },
      state: { create: {} },
    },
    include: { state: true },
  });
}

async function getSessionOrThrow(sessionId, userId) {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: { state: true },
  });

  if (!session) {
    const err = new Error("Chat session not found");
    err.status = 404;
    throw err;
  }

  return session;
}

async function addMessage(sessionId, role, content) {
  return prisma.chatMessage.create({
    data: { sessionId, role, content },
  });
}

async function getRecentMessages(sessionId, limit = 10) {
  const msgs = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  // return chronological
  return msgs.reverse();
}

async function updateState(sessionId, patch) {
  return prisma.chatSessionState.update({
    where: { sessionId },
    data: patch,
  });
}

module.exports = {
  createSession,
  getSessionOrThrow,
  addMessage,
  getRecentMessages,
  updateState,
};
