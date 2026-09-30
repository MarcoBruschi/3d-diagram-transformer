/**
 * Timeout-guarded Fetch utility.
 * Prevents client/server hangings on unresponsive or degraded upstream endpoints.
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
}

export class TimeoutError extends Error {
  constructor(message: string = 'A requisição excedeu o tempo limite máximo de espera.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = 12000, signal: externalSignal, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Link external signal if provided
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => {
      controller.abort();
      clearTimeout(timeoutHandle);
    });
  }

  try {
    const response = await fetch(input, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError' || controller.signal.aborted) {
      throw new TimeoutError(`Request timeout after ${timeoutMs}ms: ${input.toString()}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}
