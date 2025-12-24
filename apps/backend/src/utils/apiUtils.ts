import { Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
    requestId: string;
}

/**
 * 统一处理成功响应
 */
export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200) => {
    const requestId = (res.req.headers['x-request-id'] as string) || '';
    const response: ApiResponse<T> = {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
        requestId
    };
    return res.status(statusCode).json(response);
};

/**
 * 统一处理错误响应
 */
export const sendError = (res: Response, statusCode: number, code: string, message: string, details?: any) => {
    const requestId = (res.req.headers['x-request-id'] as string) || '';
    const response: ApiResponse = {
        success: false,
        error: {
            code,
            message,
            details
        },
        timestamp: new Date().toISOString(),
        requestId
    };
    return res.status(statusCode).json(response);
};

/**
 * 统一处理异常响应
 */
export const handleApiError = (res: Response, error: any, defaultMessage = 'Internal Server Error') => {
    console.error('API Error:', error);

    const statusCode = error.statusCode || (error.code === '23505' ? 409 : 500);
    const code = error.code === '23505' ? 'CONFLICT' : (error.code || 'INTERNAL_ERROR');
    const message = error.message || defaultMessage;

    return sendError(res, statusCode, code, message, process.env.NODE_ENV === 'development' ? error.stack : undefined);
};
