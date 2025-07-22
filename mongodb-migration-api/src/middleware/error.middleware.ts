import { Request, Response, NextFunction } from 'express';

/**
 * Error response interface
 */
export interface ErrorResponse {
  message: string;
  stack?: string;
  status?: number;
}

/**
 * Error handler middleware
 */
export function errorHandler(
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';
  
  // Log error
  console.error(`[Error] ${status} - ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  // Send error response
  res.status(status).json({
    error: {
      message,
      status
    }
  });
}

/**
 * Not found middleware
 */
export function notFound(req: Request, res: Response, next: NextFunction) {
  const error: ErrorResponse = {
    message: `Not Found - ${req.originalUrl}`,
    status: 404
  };
  next(error);
}