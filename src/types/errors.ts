export type GeminiApiErrorCode =
  | 'MISSING_GEMINI_KEY'
  | 'INVALID_GEMINI_KEY'
  | 'GEMINI_QUOTA_EXCEEDED'
  | 'MODEL_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNSUPPORTED_FORMAT'
  | 'UNKNOWN_ERROR';

export class GeminiApiKeyError extends Error {
  public code: GeminiApiErrorCode;
  public details?: string;

  constructor(message: string, code: GeminiApiErrorCode = 'INVALID_GEMINI_KEY', details?: string) {
    super(message);
    this.name = 'GeminiApiKeyError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, GeminiApiKeyError.prototype);
  }
}
