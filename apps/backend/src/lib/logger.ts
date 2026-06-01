import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isTest ? 'silent' : process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  base: {
    service: 'lumiere-backend',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'passwordHash',
      'accessToken',
      'refreshToken',
      '*.password',
      '*.passwordHash',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
});

export default logger;
