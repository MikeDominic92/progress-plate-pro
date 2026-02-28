import { retryWithBackoff, type RetryOptions } from './retryWithBackoff';

interface SupabaseResult<T> {
  data: T | null;
  error: { message: string; code?: string; details?: string } | null;
}

/**
 * Wraps a Supabase query with retry logic.
 * Retries on network/server errors (5xx, connection failures).
 * Does NOT retry on PGRST client errors (4xx) since those won't self-heal.
 */
export async function supabaseRetry<T>(
  fn: () => PromiseLike<SupabaseResult<T>>,
  options: Omit<RetryOptions, 'shouldRetry'> = {},
): Promise<SupabaseResult<T>> {
  return retryWithBackoff(
    async () => {
      const result = await fn();
      if (result.error) {
        const code = result.error.code || '';
        // PGRST errors (client-side, e.g. row not found, constraint violation)
        // should not be retried -- they won't self-heal
        const isClientError = code.startsWith('PGRST') || code.startsWith('23');
        if (isClientError) {
          return result; // return as-is, no retry
        }
        // Network / server errors -- throw to trigger retry
        throw result.error;
      }
      return result;
    },
    {
      maxRetries: options.maxRetries ?? 2,
      baseDelayMs: options.baseDelayMs,
      maxDelayMs: options.maxDelayMs,
      shouldRetry: (err: unknown) => {
        // Don't retry AbortError
        if (err instanceof DOMException && err.name === 'AbortError') return false;
        return true;
      },
    },
  ).catch(() => {
    // All retries exhausted -- run the fn one last time and return whatever comes back
    // so we always return { data, error } shape, never throw
    return fn() as Promise<SupabaseResult<T>>;
  });
}
