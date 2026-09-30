/**
 * Structured Enterprise JSON Logger
 * Formats events into NDJSON with automated PII and credential sanitization.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'apikey',
  'secret',
  'authorization',
  'cookie',
  'creditcard',
  'cvv',
  'stripe_signature',
]);

/**
 * Recursively redacts sensitive keys in object or array
 */
function redactSensitiveData(data: any, depth: number = 0): any {
  if (depth > 5 || data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitiveData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export interface LogContext {
  service?: string;
  requestId?: string;
  orgId?: string;
  userId?: string;
  endpoint?: string;
  [key: string]: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown) {
    const entry: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: context?.service || 'diagram3d-api',
      env: process.env.NODE_ENV || 'development',
    };

    if (context?.requestId) entry.requestId = context.requestId;
    if (context?.orgId) entry.orgId = context.orgId;
    if (context?.userId) entry.userId = context.userId;
    if (context?.endpoint) entry.endpoint = context.endpoint;

    if (context) {
      const { service, requestId, orgId, userId, endpoint, ...restContext } = context;
      if (Object.keys(restContext).length > 0) {
        entry.metadata = redactSensitiveData(restContext);
      }
    }

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
        };
      } else {
        entry.error = { message: String(error) };
      }
    }

    return entry;
  }

  public info(message: string, context?: LogContext) {
    const entry = this.formatLog('info', message, context);
    console.log(JSON.stringify(entry));
  }

  public warn(message: string, context?: LogContext, error?: unknown) {
    const entry = this.formatLog('warn', message, context, error);
    console.warn(JSON.stringify(entry));
  }

  public error(message: string, context?: LogContext, error?: unknown) {
    const entry = this.formatLog('error', message, context, error);
    console.error(JSON.stringify(entry));
  }

  public debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      const entry = this.formatLog('debug', message, context);
      console.debug(JSON.stringify(entry));
    }
  }
}

export const logger = new Logger();
