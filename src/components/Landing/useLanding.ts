import { useEffect, useState } from 'react';
import { pokemonAPI } from '../../api/pokemon';
import type { ApiPagination, PokemonCard, PokemonGeneration, PokemonType } from '../../shared/pokemon/types';

export const regions = [
  { generation: 1, name: 'Kanto', range: '001–151', count: 151, starter: 1, color: 'green', subtitle: 'Where it all began.', games: 'FireRed · LeafGreen' },
  { generation: 2, name: 'Johto', range: '152–251', count: 100, starter: 155, color: 'gold', subtitle: 'A world of new wonders.', games: 'HeartGold · SoulSilver' },
  { generation: 3, name: 'Hoenn', range: '252–386', count: 135, starter: 258, color: 'blue', subtitle: 'A little closer to nature.', games: 'Ruby · Sapphire · Emerald' },
  { generation: 4, name: 'Sinnoh', range: '387–493', count: 107, starter: 387, color: 'purple', subtitle: 'Legends are waiting.', games: 'Diamond · Pearl · Platinum' }
] as const;

export const useLanding = (initialGeneration?: PokemonGeneration) => {
  const [q, setQuery] = useState('');
  const [query, setDebouncedQuery] = useState('');
  const [type, setType] = useState<PokemonType | 'all'>('all');
  const [generation, setGeneration] = useState<PokemonGeneration | 'all'>(initialGeneration ?? 'all');
  const [offset, setOffset] = useState(0);
  const [shiny, setShiny] = useState(false);
  const [pokemon, setPokemon] = useState<PokemonCard[]>([]);
  const [pagination, setPagination] = useState<ApiPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(q); setOffset(0); }, 320);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    pokemonAPI.list({ q: query.trim(), type, generation, offset, limit: 8 }, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        if (!result.success) throw new Error(result.error.message);
        setPokemon(result.data);
        setPagination(result.meta.pagination ?? null);
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load entries'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, type, generation, offset, revision]);

  const chooseGeneration = (value: PokemonGeneration | 'all') => { setGeneration(value); setOffset(0); };
  const chooseType = (value: PokemonType | 'all') => { setType(value); setOffset(0); };
  const resetFilters = () => { setQuery(''); setType('all'); setGeneration('all'); setOffset(0); };

  return { q, type, shiny, error, offset, pokemon, loading, pagination, generation, setQuery, setShiny, setOffset, resetFilters, chooseType, chooseGeneration, retry: () => setRevision(value => value + 1) };
};
