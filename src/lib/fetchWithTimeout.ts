export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Wraps native fetch with an AbortController that auto-aborts after timeoutMs.
 * Merges an external AbortSignal (e.g. from component unmount) with the timeout signal.
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const { timeoutMs = 30_000, signal: externalSignal, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // If the caller passed an external signal, forward its abort to our controller
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const response = await fetch(url, { ...rest, signal: controller.signal });
    return response;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Distinguish external abort (user navigated away) from timeout
      if (externalSignal?.aborted) {
        throw err; // re-throw as-is so callers can ignore AbortError
      }
      throw new TimeoutError(timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}
