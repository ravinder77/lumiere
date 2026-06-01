import { Prisma } from '../generated/prisma/client';
import { isRecordNotFoundError } from './prismaErrors';

describe('prisma error helpers', () => {
  it('detects Prisma record-not-found errors', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });

    expect(isRecordNotFoundError(error)).toBe(true);
    expect(isRecordNotFoundError(new Error('different'))).toBe(false);
  });
});
