import { fetchWithTimeout, FetchWithTimeoutOptions } from './fetchWithTimeout';

/**
 * Resilient API Client with Exponential Backoff Retry and Jitter
 * Handles transient network dropouts and upstream 502/503/504 errors.
 */

export interface ApiClientOptions extends FetchWithTimeoutOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  idempotencyKey?: string;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    initialDelayMs = 250,
    maxDelayMs = 2500,
    timeoutMs = 15000,
    idempotencyKey,
    headers: customHeaders = {},
    ...restOptions
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  while (attempt <= maxRetries) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        ...restOptions,
        headers,
        timeoutMs,
      });

      // If status is successful, parse JSON or return text
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return (await response.json()) as T;
        }
        return (await response.text()) as unknown as T;
      }

      // Check if retryable
      const isRetryable = RETRYABLE_STATUS_CODES.has(response.status);
      if (!isRetryable || attempt >= maxRetries) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText };
        }
        const error = new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }
    } catch (err: any) {
      if (attempt >= maxRetries) {
        throw err;
      }
    }

    attempt++;
    // Exponential backoff with random full jitter
    const jitter = Math.random() * delay * 0.5;
    const sleepDuration = Math.min(delay + jitter, maxDelayMs);
    await new Promise((resolve) => setTimeout(resolve, sleepDuration));
    delay *= 2;
  }

  throw new Error(`Failed to complete request after ${maxRetries + 1} attempts: ${endpoint}`);
}
