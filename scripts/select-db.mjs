// Switches prisma/schema.prisma between "sqlite" and "postgresql"
// depending on DATABASE_URL. Runs before every prisma/next command.
import fs from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const url = process.env.DATABASE_URL || "";
const provider = /^postgres(ql)?:\/\//.test(url) ? "postgresql" : "sqlite";
const file = "prisma/schema.prisma";
const src = fs.readFileSync(file, "utf8");
const next = src.replace(
  /(datasource db \{\s*provider\s*=\s*)"[^"]+"/,
  `$1"${provider}"`,
);
if (next !== src) fs.writeFileSync(file, next);
console.log(`[db] using ${provider}${provider === "sqlite" ? " (prisma/dev.db)" : ""}`);
