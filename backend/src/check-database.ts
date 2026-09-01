import { databaseProvider, dbGet, initializeDatabase, seedDatabase } from "./database.js";

await initializeDatabase();
await seedDatabase();

const companies = await dbGet<{ total: number }>("SELECT COUNT(*) as total FROM companies");
const tests = await dbGet<{ total: number }>("SELECT COUNT(*) as total FROM tests");

console.log(JSON.stringify({
  status: "ok",
  provider: databaseProvider,
  companies: companies?.total ?? 0,
  tests: tests?.total ?? 0
}, null, 2));
