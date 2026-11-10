import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Buddy photos are resized in the browser (~300KB each), 5 photos fit easily.
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Native SQLite driver is only used locally; never bundle it.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
