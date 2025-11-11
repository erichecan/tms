import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'tms_'
}); // 2025-11-11T15:28:33Z Added by Assistant: Collect Node.js default metrics

const httpRequestDuration = new client.Histogram({
  name: 'tms_http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

const httpRequestCounter = new client.Counter({
  name: 'tms_http_requests_total',
  help: 'Total HTTP requests processed',
  labelNames: ['method', 'route', 'status_code']
}); // 2025-11-11T15:28:33Z Added by Assistant: Track request totals

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCounter);

const sanitizeRoute = (req: Request): string => {
  if (req.route?.path) {
    return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
  }
  return req.originalUrl.split('?')[0] || req.path || 'unknown';
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path === '/metrics') {
    return next();
  }

  const route = sanitizeRoute(req);
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationSeconds = Number(end - start) / 1_000_000_000;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };

    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestCounter.inc(labels);
  });

  next();
}; // 2025-11-11T15:28:33Z Added by Assistant: HTTP metrics middleware

export const metricsHandler = async (_req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}; // 2025-11-11T15:28:33Z Added by Assistant: /metrics endpoint handler

export const metricsRegister = register;

