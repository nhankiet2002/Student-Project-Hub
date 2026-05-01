import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
export const db = prisma; // Alias for backward compatibility if needed

export * from "@prisma/client";
