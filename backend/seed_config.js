require('dotenv').config();
const prisma = require("./src/services/prisma");

async function seed() {
  console.log("Seeding initial configuration...");

  const categories = [
    "Software", "Hardware", "Network", "Access Control", "Other"
  ];

  const priorities = [
    { name: "Low", level: 1 },
    { name: "Medium", level: 2 },
    { name: "High", level: 3 },
    { name: "Urgent", level: 4 }
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  for (const p of priorities) {
    await prisma.priority.upsert({
      where: { name: p.name },
      update: { level: p.level },
      create: { name: p.name, level: p.level }
    });
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
