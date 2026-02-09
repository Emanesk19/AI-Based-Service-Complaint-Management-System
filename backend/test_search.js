require("dotenv").config();
const searchService = require("./src/services/search.service");
const prisma = require("./src/services/prisma");

async function testSearch() {
  console.log("Testing search functionality...");
  try {
    // Test 1: Empty search (should return recent tickets)
    console.log("\n1. Testing empty search...");
    const result1 = await searchService.searchTickets({ limit: 2 });
    console.log(`Found ${result1.tickets.length} tickets. Total: ${result1.pagination.total}`);

    // Test 2: Search by status "Resolved"
    console.log("\n2. Testing status filter (Resolved)...");
    const result2 = await searchService.searchTickets({ status: "Resolved", limit: 2 });
    console.log(`Found ${result2.tickets.length} resolved tickets.`);
    if (result2.tickets.length > 0) {
      console.log(`Sample status: ${result2.tickets[0].status}`);
    }

    // Test 3: Search text (if any tickets exist)
    if (result1.tickets.length > 0) {
      const sample = result1.tickets[0];
      const keyword = sample.title.split(" ")[0]; // First word of title
      console.log(`\n3. Testing text search for "${keyword}"...`);
      const result3 = await searchService.searchTickets({ q: keyword });
      console.log(`Found ${result3.tickets.length} tickets matching "${keyword}".`);
    }

  } catch (error) {
    console.error("Search test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch();
