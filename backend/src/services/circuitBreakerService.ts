/**
 * CIRCUIT BREAKER SERVICE
 *
 * Prevents cascading failures when external services (OpenAI, Gemini, Cerebras,
 * Pinecone, etc.) become unavailable.
 *
 * States:
 *  - CLOSED  — normal operation, requests pass through
 *  - OPEN    — service is down, requests fail immediately (fast-fail)
 *  - HALF_OPEN — testing if service recovered (limited requests pass through)
 *
 * Also includes retry with exponential backoff for transient failures.
 *
 * @module services/circuitBreakerService
 * @version 1.0.0
 */

import logger from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number;
  /** Time in ms before attempting a recovery (OPEN → HALF_OPEN) */
  resetTimeout: number;
  /** Number of successful calls in HALF_OPEN before closing */
  successThreshold: number;
  /** Timeout per individual call in ms */
  callTimeout: number;
  /** Name for logging */
  name: string;
}

export interface RetryOptions {
  /** Maximum number of retries */
  maxRetries: number;
  /** Base delay in ms between retries (doubled each attempt) */
  baseDelay: number;
  /** Maximum delay cap in ms */
  maxDelay: number;
  /** Which errors should trigger a retry (default: all non-4xx) */
  retryableCheck?: (error: any) => boolean;
}

export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private nextRetryTime = 0;
  private totalCalls = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  private readonly options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> & { name: string }) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30_000, // 30 seconds
      successThreshold: 2,
      callTimeout: 15_000, // 15 seconds
      ...options,
    };
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    // Check if circuit is OPEN
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextRetryTime) {
        // Still in cooldown — fail fast
        throw new CircuitBreakerError(
          `Circuit breaker OPEN for ${this.options.name}. Try again in ${Math.ceil((this.nextRetryTime - Date.now()) / 1000)}s`,
          this.options.name
        );
      }
      // Cooldown expired — transition to HALF_OPEN
      this.state = CircuitState.HALF_OPEN;
      this.successes = 0;
      logger.info(`[CircuitBreaker] ${this.options.name}: OPEN → HALF_OPEN (testing recovery)`);
    }

    try {
      // Execute with timeout
      const result = await this.withTimeout(fn(), this.options.callTimeout);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Execute with retry + circuit breaker
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryOpts?: Partial<RetryOptions>
  ): Promise<T> {
    const opts: RetryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10_000,
      retryableCheck: defaultRetryableCheck,
      ...retryOpts,
    };

    let lastError: any;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await this.execute(fn);
      } catch (error: any) {
        lastError = error;

        // Don't retry circuit breaker opens
        if (error instanceof CircuitBreakerError) {
          throw error;
        }

        // Don't retry non-retryable errors
        if (opts.retryableCheck && !opts.retryableCheck(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt < opts.maxRetries) {
          const delay = Math.min(
            opts.baseDelay * Math.pow(2, attempt) + Math.random() * 500,
            opts.maxDelay
          );
          logger.warn(
            `[CircuitBreaker] ${this.options.name}: Retry ${attempt + 1}/${opts.maxRetries} after ${Math.round(delay)}ms`,
            { error: error.message }
          );
          await sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Get current stats
   */
  getStats(): CircuitBreakerStats {
    return {
      name: this.options.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    logger.info(`[CircuitBreaker] ${this.options.name}: Manually RESET to CLOSED`);
  }

  // --- Internal ---

  private onSuccess(): void {
    this.lastSuccess = new Date();
    this.totalSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        logger.info(`[CircuitBreaker] ${this.options.name}: HALF_OPEN → CLOSED (recovered)`);
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failures = 0;
    }
  }

  private onFailure(error: any): void {
    this.lastFailure = new Date();
    this.totalFailures++;
    this.failures++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Single failure in HALF_OPEN → back to OPEN
      this.state = CircuitState.OPEN;
      this.nextRetryTime = Date.now() + this.options.resetTimeout;
      logger.warn(`[CircuitBreaker] ${this.options.name}: HALF_OPEN → OPEN (still failing)`, {
        error: error?.message,
      });
    } else if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextRetryTime = Date.now() + this.options.resetTimeout;
      logger.error(
        `[CircuitBreaker] ${this.options.name}: CLOSED → OPEN after ${this.failures} failures`,
        { error: error?.message }
      );
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`[CircuitBreaker] ${this.options.name}: Call timed out after ${ms}ms`));
      }, ms);

      promise
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}

// =============================================================================
// ERROR CLASS
// =============================================================================

export class CircuitBreakerError extends Error {
  public readonly serviceName: string;

  constructor(message: string, serviceName: string) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.serviceName = serviceName;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Default retryable check — retry on 5xx, timeouts, network errors
 * Don't retry on 4xx (client errors)
 */
function defaultRetryableCheck(error: any): boolean {
  // Don't retry 4xx client errors
  if (error?.status >= 400 && error?.status < 500) return false;
  if (error?.response?.status >= 400 && error?.response?.status < 500) return false;

  // Retry on network/timeout errors
  if (error?.code === 'ECONNREFUSED') return true;
  if (error?.code === 'ECONNRESET') return true;
  if (error?.code === 'ETIMEDOUT') return true;
  if (error?.message?.includes('timeout')) return true;

  // Retry on 5xx
  if (error?.status >= 500) return true;
  if (error?.response?.status >= 500) return true;

  // Retry on rate limit (429)
  if (error?.status === 429 || error?.response?.status === 429) return true;

  // Default: retry
  return true;
}

// =============================================================================
// PRE-CONFIGURED CIRCUIT BREAKERS
// =============================================================================

/** Circuit breaker for OpenAI API calls */
export const openAICircuit = new CircuitBreaker({
  name: 'OpenAI',
  failureThreshold: 5,
  resetTimeout: 30_000,
  callTimeout: 30_000, // AI calls can be slow
});

/** Circuit breaker for Google Gemini API calls */
export const geminiCircuit = new CircuitBreaker({
  name: 'Gemini',
  failureThreshold: 5,
  resetTimeout: 30_000,
  callTimeout: 30_000,
});

/** Circuit breaker for Cerebras API calls */
export const cerebrasCircuit = new CircuitBreaker({
  name: 'Cerebras',
  failureThreshold: 5,
  resetTimeout: 60_000,
  callTimeout: 20_000,
});

/** Circuit breaker for Pinecone vector store */
export const pineconeCircuit = new CircuitBreaker({
  name: 'Pinecone',
  failureThreshold: 3,
  resetTimeout: 20_000,
  callTimeout: 10_000,
});

/**
 * Get stats for all pre-configured circuit breakers
 */
export function getAllCircuitStats(): CircuitBreakerStats[] {
  return [
    openAICircuit.getStats(),
    geminiCircuit.getStats(),
    cerebrasCircuit.getStats(),
    pineconeCircuit.getStats(),
  ];
}

export default {
  CircuitBreaker,
  openAICircuit,
  geminiCircuit,
  cerebrasCircuit,
  pineconeCircuit,
  getAllCircuitStats,
};
