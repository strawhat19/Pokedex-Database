import { useLocalSearchParams } from 'expo-router';
import Landing from '../src/components/Landing';
import type { PokemonGeneration } from '../src/shared/pokemon/types';

export default function PokedexPage() {
  const { generation } = useLocalSearchParams<{ generation?: string }>();
  const value = Number(generation);
  const initialGeneration = [1, 2, 3, 4].includes(value) ? value as PokemonGeneration : undefined;
  return <Landing key={initialGeneration ?? 'all'} catalogOnly initialGeneration={initialGeneration} />;
}
