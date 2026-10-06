import { cacheStatus, ApiFailure } from './upstream';
import { maximumPageSize } from './pokemon';
import type { ApiMeta, ApiEnvelope } from '../shared/pokemon/types';

const startedAt = Date.now();
const rateWindow = 60_000;
const maximumRequests = 120;
const maximumClients = 2000;
const rateBuckets = new Map<string, { count: number; resets: number }>();

export const operationRegistry = [
  { method: 'GET', path: '/api', description: 'API directory and connection metadata' },
  { method: 'GET', path: '/api/health', description: 'Runtime health and cache status' },
  { method: 'GET', path: '/api/status', description: 'Alias of runtime health' },
  { method: 'GET', path: '/api/v1/pokemon', description: 'Paginated Pokémon cards, generations 1–4' },
  { method: 'GET', path: '/api/v1/pokemon/{id}', description: 'Pokémon detail by National Dex number or name' },
  { method: 'GET', path: '/api/v1/pokemon/{id}/evolutions', description: 'Evolution branches and method constraints' },
];

export const responseMeta = (extra: Partial<ApiMeta> = {}): ApiMeta => ({
  ...extra,
  version: 'v1',
  source: 'PokéAPI',
  timestamp: new Date().toISOString(),
  storageMode: 'server-memory-cache',
  limits: { species: 493, generations: [1, 2, 3, 4], maxPageSize: maximumPageSize },
});

const corsHeaders = (request: Request): Headers => {
  const headers = new Headers({
    Vary: 'Origin',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  const origin = request.headers.get('origin');
  const allowed = (process.env.API_ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  if (origin && (origin === new URL(request.url).origin || allowed.includes(origin))) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Accept, X-API-Key');
    headers.set('Access-Control-Expose-Headers', 'X-Request-Id, Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining');
  }
  return headers;
};

export const preflight = (request: Request) => new Response(null, { status: 204, headers: corsHeaders(request) });

const matchesSecret = (value: string, secret: string) => {
  let difference = value.length ^ secret.length;
  for (let index = 0; index < secret.length; index += 1) {
    difference |= (value.charCodeAt(index) || 0) ^ secret.charCodeAt(index);
  }
  return difference === 0;
};

const enforceKey = (request: Request) => {
  const secret = process.env.API_KEY;
  if (secret && !matchesSecret(request.headers.get('x-api-key') ?? '', secret)) {
    throw new ApiFailure('UNAUTHORIZED', 'A valid X-API-Key is required', 401);
  }
};

const enforceRateLimit = (request: Request, headers: Headers) => {
  const now = Date.now();
  // Forwarded IP headers are trusted only when the deployment explicitly enables its proxy.
  const client = process.env.API_TRUST_PROXY === 'true'
    ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'development'
    : 'development';
  const existing = rateBuckets.get(client);
  const bucket = existing && existing.resets > now ? existing : { count: 0, resets: now + rateWindow };
  if (!existing && rateBuckets.size >= maximumClients) {
    for (const [key, entry] of rateBuckets) {
      if (entry.resets <= now) rateBuckets.delete(key);
    }
    if (rateBuckets.size >= maximumClients) {
      const oldest = rateBuckets.keys().next().value;
      if (oldest) rateBuckets.delete(oldest);
    }
  }
  bucket.count += 1;
  rateBuckets.set(client, bucket);
  headers.set('X-RateLimit-Limit', String(maximumRequests));
  headers.set('X-RateLimit-Remaining', String(Math.max(0, maximumRequests - bucket.count)));
  if (bucket.count > maximumRequests) {
    const seconds = Math.ceil((bucket.resets - now) / 1000);
    headers.set('Retry-After', String(seconds));
    throw new ApiFailure('RATE_LIMITED', 'Too many requests. Please wait and try again', 429, true);
  }
};

type OperationResult<T> = { data: T; meta?: Partial<ApiMeta> };

export const respond = async <T>(
  request: Request,
  operation: () => Promise<OperationResult<T>> | OperationResult<T>,
  protectedResource = true,
): Promise<Response> => {
  const headers = corsHeaders(request);
  const requestId = globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  headers.set('X-Request-Id', requestId);
  try {
    enforceRateLimit(request, headers);
    if (protectedResource) enforceKey(request);
    const result = await operation();
    const body: ApiEnvelope<T> = { requestId, success: true, data: result.data, meta: responseMeta(result.meta) };
    return new Response(JSON.stringify(body), { status: 200, headers });
  } catch (error) {
    const failure = error instanceof ApiFailure
      ? error
      : new ApiFailure('INTERNAL_ERROR', 'The API could not complete this request. Please try again', 500, true);
    const retryAfter = headers.get('Retry-After');
    const body: ApiEnvelope<T> = {
      requestId,
      data: null,
      success: false,
      meta: responseMeta(),
      error: {
        code: failure.code,
        message: failure.message,
        retryable: failure.retryable,
        ...(retryAfter ? { retryAfterSeconds: Number(retryAfter) } : {}),
      },
    };
    return new Response(JSON.stringify(body), { status: failure.status, headers });
  }
};

export const apiDirectory = () => ({
  status: 'connected',
  title: 'Pokedex Database API',
  timestamp: new Date().toISOString(),
  success: true,
  storageMode: 'server-memory-cache',
  connection: 'Connected to Pokedex Database. Pokémon data is fetched from PokéAPI and cached on this server.',
  authentication: process.env.API_KEY ? 'X-API-Key required on /api/v1/*' : 'Public development access',
  operations: operationRegistry,
  specification: '/openapi.json',
  localServices: ['auth', 'users', 'teams', 'votes'],
  localServicesNote: 'Trainer records, teams and votes use browser or device storage through the app service. They are not public HTTP endpoints.',
  dataScope: 'National Dex #001–493. English game descriptions are limited to generations 1–4. Types, abilities and stats reflect current PokéAPI data.',
});

export const apiHealth = () => {
  const memory = typeof process.memoryUsage === 'function' ? process.memoryUsage() : null;
  return {
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptimeSeconds: typeof process.uptime === 'function' ? Math.floor(process.uptime()) : Math.floor((Date.now() - startedAt) / 1000),
    cache: cacheStatus(),
    ...(memory ? { memoryBytes: { rss: memory.rss, heapUsed: memory.heapUsed } } : {}),
    message: 'The API process is ready. This health response does not probe upstream availability.',
  };
};
