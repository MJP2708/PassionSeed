import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

// No DATABASE_URL → local SQLite file. Postgres URL → Neon/Postgres.
const url =
  process.env.DATABASE_URL || `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url },
});
