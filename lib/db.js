import { PrismaClient } from "@prisma/client";

console.log("🔥 NEXT.JS IS USING DATABASE:", process.env.DATABASE_URL);  // <--- DEBE ESTAR ANTES

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
