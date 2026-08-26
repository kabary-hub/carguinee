/**
 * Retry logic avec backoff exponentiel pour les appels externes.
 *
 * Usage :
 *   const result = await retry(() => fetchExternalAPI(), { maxRetries: 3 });
 */

interface RetryOptions {
  /** Nombre maximum de tentatives (défaut: 3) */
  maxRetries?: number;
  /** Délai initial en ms (défaut: 1000) */
  baseDelayMs?: number;
  /** Facteur de backoff exponentiel (défaut: 2) */
  backoffFactor?: number;
  /** Délai maximum en ms (défaut: 30000) */
  maxDelayMs?: number;
  /** Fonction pour décider si on doit réessayer (défaut: toujours) */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback appelé à chaque retry */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 30_000,
  shouldRetry: () => true,
  onRetry: () => {},
};

export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxRetries || !opts.shouldRetry(lastError, attempt + 1)) {
        throw lastError;
      }

      const delayMs = Math.min(
        opts.baseDelayMs * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelayMs,
      );

      opts.onRetry(lastError, attempt + 1, delayMs);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError ?? new Error("Retry failed");
}

/**
 * Wrapper pour les appels Orange Money API avec retry automatique.
 */
export async function retryOMApi<T>(fn: () => Promise<T>): Promise<T> {
  return retry(fn, {
    maxRetries: 3,
    baseDelayMs: 2000,
    backoffFactor: 2,
    shouldRetry: (error) => {
      // Retry sur les erreurs réseau, pas sur les erreurs 4xx
      const msg = error.message.toLowerCase();
      return msg.includes("timeout") || msg.includes("econnrefused") || msg.includes("503");
    },
  });
}
