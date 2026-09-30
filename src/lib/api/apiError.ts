import { NextResponse } from 'next/server';

/**
 * Enterprise API Error Envelope
 * Guarantees uniform structure for all error responses across the platform.
 */

export interface ApiErrorEnvelope {
  error: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  requestId: string;
  timestamp: string;
}

export function createApiError(
  message: string,
  code: string = 'INTERNAL_ERROR',
  statusCode: number = 500,
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse<ApiErrorEnvelope> {
  const reqId = requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return NextResponse.json(
    {
      error: message,
      code,
      statusCode,
      details,
      requestId: reqId,
      timestamp: new Date().toISOString(),
    },
    {
      status: statusCode,
      headers: {
        'X-Request-Id': reqId,
      },
    }
  );
}

export class AppApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string = 'API_ERROR',
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppApiError';
  }
}
