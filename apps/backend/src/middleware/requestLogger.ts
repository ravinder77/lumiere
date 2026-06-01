import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pinoHttp from 'pino-http';
import logger from '../lib/logger';

type ExpressRequestLike = IncomingMessage & {
  originalUrl?: string;
};

function requestId(req: IncomingMessage): string {
  const header = req.headers['x-request-id'];
  if (Array.isArray(header)) {
    return header[0] ?? crypto.randomUUID();
  }

  return header ?? crypto.randomUUID();
}

function logUrl(req: IncomingMessage): string | undefined {
  return (req as ExpressRequestLike).originalUrl ?? req.url;
}

export const requestLogger = pinoHttp({
  logger,
  genReqId: requestId,
  autoLogging: {
    ignore: (req) => req.url === '/metrics',
  },
  customLogLevel(_req: IncomingMessage, res: ServerResponse, error?: Error) {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage(req: IncomingMessage, res: ServerResponse) {
    return `${req.method} ${logUrl(req)} completed with ${res.statusCode}`;
  },
  customErrorMessage(req: IncomingMessage, res: ServerResponse) {
    return `${req.method} ${logUrl(req)} failed with ${res.statusCode}`;
  },
});
