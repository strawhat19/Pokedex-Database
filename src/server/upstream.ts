const upstreamOrigin = 'https://pokeapi.co/api/v2/';
const cacheDuration = 6 * 60 * 60 * 1000;
const maximumEntries = 1200;
const upstreamTimeout = 15_000;
const maximumConcurrent = 8;
const maximumQueued = 128;

type CacheEntry = { expires: number; value: unknown };

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
const queue: Array<() => void> = [];
let concurrent = 0;

export class ApiFailure extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 500,
    public retryable = false,
  ) {
    super(message);
    this.name = 'ApiFailure';
  }
}

const acquire = async () => {
  if (concurrent < maximumConcurrent) {
    concurrent += 1;
    return;
  }
  if (queue.length >= maximumQueued) {
    throw new ApiFailure('UPSTREAM_BUSY', 'The Pokémon database is busy. Please try again shortly', 503, true);
  }
  await new Promise<void>((resolve, reject) => {
    const wake = () => {
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(() => {
      const index = queue.indexOf(wake);
      if (index >= 0) queue.splice(index, 1);
      reject(new ApiFailure('UPSTREAM_BUSY', 'The Pokémon database is busy. Please try again shortly', 503, true));
    }, upstreamTimeout);
    queue.push(wake);
  });
};

const release = () => {
  const next = queue.shift();
  if (next) next();
  else concurrent -= 1;
};

const cacheValue = (key: string, value: unknown) => {
  if (cache.size >= maximumEntries) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { value, expires: Date.now() + cacheDuration });
};

export const fetchPokeAPI = async <T>(path: string): Promise<T> => {
  const url = new URL(path, upstreamOrigin);
  if (url.origin !== 'https://pokeapi.co' || !url.pathname.startsWith('/api/v2/')) {
    throw new ApiFailure('INVALID_SOURCE', 'The upstream resource is not allowed', 502);
  }
  const key = url.href;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value as T;
  if (cached) cache.delete(key);
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const request = (async () => {
    await acquire();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), upstreamTimeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new ApiFailure(
          response.status === 404 ? 'NOT_FOUND' : 'UPSTREAM_UNAVAILABLE',
          response.status === 404 ? 'That Pokémon resource was not found' : 'PokéAPI is unavailable. Please try again',
          response.status === 404 ? 404 : 502,
          response.status !== 404,
        );
      }
      const value = await response.json() as T;
      cacheValue(key, value);
      return value;
    } catch (error) {
      if (error instanceof ApiFailure) throw error;
      throw new ApiFailure(
        controller.signal.aborted ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
        controller.signal.aborted ? 'PokéAPI took too long to respond. Please try again' : 'Unable to reach PokéAPI. Please try again',
        controller.signal.aborted ? 504 : 502,
        true,
      );
    } finally {
      clearTimeout(timeout);
      release();
    }
  })();

  inFlight.set(key, request);
  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
};

export const cacheStatus = () => ({
  entries: cache.size,
  inFlight: inFlight.size,
  queued: queue.length,
  ttlSeconds: cacheDuration / 1000,
  maxEntries: maximumEntries,
  maxConcurrent: maximumConcurrent,
  maxQueued: maximumQueued,
  queueTimeoutSeconds: upstreamTimeout / 1000,
});
