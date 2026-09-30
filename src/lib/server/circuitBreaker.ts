/**
 * Circuit Breaker pattern implementation to prevent cascading outages
 * and thread starvation during third-party API degradations (e.g. Gemini API, Stripe).
 */

export interface CircuitBreakerOptions {
  failureThreshold?: number;     // Failures before tripping (default 5)
  resetTimeoutMs?: number;       // Time in ms before testing half-open state (default 30,000ms = 30s)
  timeoutMs?: number;            // Execution timeout for single call (default 25,000ms = 25s)
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly timeoutMs: number;

  constructor(private readonly name: string, options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.timeoutMs = options.timeoutMs ?? 25000;
  }

  public getState(): CircuitState {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      }
    }
    return this.state;
  }

  public async execute<T>(action: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      const remainingSec = Math.ceil((this.lastFailureTime + this.resetTimeoutMs - Date.now()) / 1000);
      throw new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN. Fast failing request. Try again in ${remainingSec}s.`);
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const result = await action(controller.signal);
      this.onSuccess();
      return result;
    } catch (err: any) {
      this.onFailure(err);
      throw err;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(err: any) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.warn(`[CircuitBreaker:${this.name}] Failure recorded (${this.failureCount}/${this.failureThreshold}):`, err?.message || err);

    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      console.error(`[CircuitBreaker:${this.name}] Circuit tripped to OPEN state!`);
    }
  }

  public reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

// Global singletons for common external services
export const geminiCircuitBreaker = new CircuitBreaker('gemini-api', {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  timeoutMs: 25000,
});

export const stripeCircuitBreaker = new CircuitBreaker('stripe-api', {
  failureThreshold: 5,
  resetTimeoutMs: 20000,
  timeoutMs: 15000,
});
