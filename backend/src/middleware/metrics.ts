import type { NextFunction, Request, Response } from 'express';
import { collectDefaultMetrics, Counter, Histogram, register } from 'prom-client';

const metricsPrefix = 'lumiere_backend_';

collectDefaultMetrics({ prefix: metricsPrefix });

const httpRequestsTotal = new Counter({
  name: `${metricsPrefix}http_requests_total`,
  help: 'Total number of HTTP requests handled by the backend.',
  labelNames: ['method', 'route', 'status_code'] as const,
});

const httpRequestDurationSeconds = new Histogram({
  name: `${metricsPrefix}http_request_duration_seconds`,
  help: 'HTTP request duration in seconds.',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

function pathSegments(path: string) {
  return path.split('/').filter(Boolean);
}

function requestPath(req: Request) {
  try {
    return new URL(req.originalUrl, 'http://localhost').pathname;
  } catch {
    return req.path;
  }
}

function normalizePath(path: string) {
  const normalized = pathSegments(path).map((segment) => {
    if (/^\d+$/.test(segment)) return ':id';
    if (/^[0-9a-f]{16,}$/i.test(segment)) return ':id';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment)) {
      return ':id';
    }
    return segment;
  });

  return normalized.length > 0 ? `/${normalized.join('/')}` : '/';
}


function routeLabel(req: Request) {
  if (req.route?.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }

  return normalizePath(requestPath(req));
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: routeLabel(req),
      status_code: String(res.statusCode),
    };
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}

export async function metricsHandler(_req: Request, res: Response) {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
}
