import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

type PC = InstanceType<typeof PrismaClient>

const globalForPrisma = globalThis as unknown as { prisma: PC | undefined }

function createPrisma(): PC {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter }) as PC
}

export const prisma: PC = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
