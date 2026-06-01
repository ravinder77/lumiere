import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import logger from './logger';

type LoggedPrismaClient = PrismaClient<'query' | 'error' | 'warn'>;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: LoggedPrismaClient | undefined;
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// Prevent multiple instances in dev (hot-reload)
const shouldLogQueries = process.env.PRISMA_QUERY_LOGGING === 'true';
const createdPrisma = !globalThis.__prisma;

const prisma = globalThis.__prisma ?? new PrismaClient({
  adapter,
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
    ...(shouldLogQueries ? [{ emit: 'event' as const, level: 'query' as const }] : []),
  ],
});

if (createdPrisma) {
  prisma.$on('error', (event) => {
    logger.error({ target: event.target }, event.message);
  });

  prisma.$on('warn', (event) => {
    logger.warn({ target: event.target }, event.message);
  });

  if (shouldLogQueries) {
    prisma.$on('query', (event) => {
      logger.debug(
        {
          query: event.query,
          params: event.params,
          durationMs: event.duration,
          target: event.target,
        },
        'Prisma query'
      );
    });
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
