import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaClient: PrismaClient;

// Detect PostgreSQL in production (Railway/Render/etc.) vs local SQLite
if (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  prismaClient = new PrismaClient({
    adapter,
  });
} else {
  // Fallback to SQLite in development
  const adapter = new PrismaBetterSqlite3({
    url: 'file:./prisma/dev.db',
  });

  prismaClient = new PrismaClient({
    adapter,
    log: ['query'],
  });
}

export const prisma = globalForPrisma.prisma || prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
