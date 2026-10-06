import { Platform } from 'react-native';
import type {
  ApiEnvelope,
  PokemonCard,
  PokemonDetail,
  PokemonEvolution,
  PokemonListQuery,
} from '../shared/pokemon/types';

const requestTimeout = 45_000;

const isEnvelope = (value: unknown): value is ApiEnvelope<unknown> => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (typeof record.requestId !== 'string' || !record.meta || typeof record.meta !== 'object') return false;
  const meta = record.meta as Record<string, unknown>;
  if (meta.version !== 'v1' || meta.source !== 'PokéAPI' || typeof meta.timestamp !== 'string') return false;
  if (record.success === true) return 'data' in record && record.data !== undefined;
  if (record.success !== false || record.data !== null || !record.error || typeof record.error !== 'object') return false;
  const error = record.error as Record<string, unknown>;
  return typeof error.code === 'string' && typeof error.message === 'string' && typeof error.retryable === 'boolean';
};

export class PokemonAPIError extends Error {
  constructor(
    message: string,
    public code = 'NETWORK_ERROR',
    public retryable = true,
  ) {
    super(message);
    this.name = 'PokemonAPIError';
  }
}

const apiOrigin = () => {
  const configured = process.env.EXPO_PUBLIC_API_ORIGIN?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Invalid protocol');
      return url.origin;
    } catch {
      throw new PokemonAPIError('Set EXPO_PUBLIC_API_ORIGIN to a valid server URL', 'INVALID_API_ORIGIN', false);
    }
  }
  if (Platform.OS !== 'web') {
    throw new PokemonAPIError('Connect your device to the API by setting EXPO_PUBLIC_API_ORIGIN', 'API_CONNECTION_NEEDED', false);
  }
  return '';
};

const request = async <T>(path: string, signal?: AbortSignal): Promise<ApiEnvelope<T>> => {
  const origin = apiOrigin();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const timeout = setTimeout(() => controller.abort(), requestTimeout);
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    const response = await fetch(`${origin}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    const value: unknown = await response.json().catch(() => {
      throw new PokemonAPIError('The API returned an unreadable response', 'INVALID_RESPONSE');
    });
    if (!isEnvelope(value) || (response.ok && !value.success) || (!response.ok && value.success)) {
      throw new PokemonAPIError('The API returned an unreadable response', 'INVALID_RESPONSE');
    }
    return value as ApiEnvelope<T>;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof PokemonAPIError) throw error;
    throw new PokemonAPIError(
      controller.signal.aborted ? 'The API took too long to respond. Try again' : 'Unable to reach the Pokémon database. Check your connection and try again',
      controller.signal.aborted ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
};

const list = (query: PokemonListQuery = {}, signal?: AbortSignal) => {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.type) params.set('type', query.type);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.shiny !== undefined) params.set('shiny', String(query.shiny));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  if (query.generation) params.set('generation', String(query.generation));
  const search = params.toString();
  return request<PokemonCard[]>(`/api/v1/pokemon${search ? `?${search}` : ''}`, signal);
};

export const pokemonAPI = {
  list,
  detail: (id: number | string, signal?: AbortSignal) => request<PokemonDetail>(`/api/v1/pokemon/${encodeURIComponent(String(id))}`, signal),
  evolutions: (id: number | string, signal?: AbortSignal) => request<PokemonEvolution>(`/api/v1/pokemon/${encodeURIComponent(String(id))}/evolutions`, signal),
};

export type { PokemonCard, PokemonDetail, PokemonListQuery, PokemonEvolution } from '../shared/pokemon/types';
