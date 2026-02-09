require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);
    users.forEach(u => console.log(`- ${u.name} (${u.email})`));
  } catch (err) {
    console.error("QUERY FAILED:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
