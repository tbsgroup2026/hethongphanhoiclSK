import { createPrismaInstance } from "@/lib/prisma-runtime";
import type { PrismaClient } from "@/generated/prisma/client";

type PrismaInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaInstance | undefined;
};

let clientPromise: Promise<PrismaInstance> | null = null;

export async function getPrisma(): Promise<PrismaInstance> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (!clientPromise) clientPromise = createPrismaInstance();
  const client = await clientPromise;
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}
