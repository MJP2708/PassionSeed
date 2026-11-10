import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon") as typeof import("@prisma/adapter-neon");
    return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  }
  // Local dev: SQLite file. Loaded lazily so it's never needed on Vercel.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
  const file = url?.startsWith("file:") ? url : `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: file }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
