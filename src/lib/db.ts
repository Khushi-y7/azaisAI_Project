import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton: without this, every hot-reload would
// open a fresh SQLite connection and eventually exhaust file handles.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
