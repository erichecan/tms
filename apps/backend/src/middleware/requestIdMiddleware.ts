import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContext } from '../utils/RequestContext';

/**
 * Middleware to handle Request ID propagation
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Extract from header or generate
    const headerId = req.headers['x-request-id'];
    const requestId = (Array.isArray(headerId) ? headerId[0] : headerId) || uuidv4();

    // Set on request object for backward compatibility
    (req as any).requestId = requestId;
    req.headers['x-request-id'] = requestId;

    // Set on response headers
    res.setHeader('X-Request-Id', requestId);

    // Intercept res.json to automatically include requestId
    const originalJson = res.json;
    res.json = function (body: any) {
        if (body && typeof body === 'object' && !Array.isArray(body)) {
            if (body.requestId === undefined) {
                body.requestId = requestId;
                if (!body.timestamp) {
                    body.timestamp = new Date().toISOString();
                }
            }
        }
        return originalJson.call(this, body);
    };

    // Run the rest of the request within the context
    RequestContext.runWithRequestId(requestId, () => {
        next();
    });
};
