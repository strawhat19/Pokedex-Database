export type PokemonGeneration = 1 | 2 | 3 | 4;

export type PokemonType =
  | 'ice' | 'bug' | 'fire' | 'dark' | 'rock' | 'water' | 'steel' | 'grass'
  | 'ghost' | 'fairy' | 'flying' | 'ground' | 'poison' | 'normal' | 'dragon'
  | 'psychic' | 'fighting' | 'electric';

export const pokemonTypes: PokemonType[] = [
  'bug', 'dark', 'ice', 'fire', 'rock', 'fairy', 'ghost', 'grass', 'steel',
  'water', 'dragon', 'flying', 'ground', 'normal', 'poison', 'psychic',
  'electric', 'fighting',
];

export interface PokemonDescription {
  text: string;
  version: string;
  language: 'en';
}

export interface PokemonAbility {
  name: string;
  slot: number;
  isHidden: boolean;
}

export interface PokemonStat {
  name: string;
  value: number;
  effort: number;
}

export interface PokemonArtwork {
  default: string | null;
  shiny: string | null;
  sprite: string | null;
  shinySprite: string | null;
}

export interface PokemonCard {
  id: number;
  name: string;
  category: string;
  displayName: string;
  description: string;
  weightKg: number;
  heightMeters: number;
  types: PokemonType[];
  stats: PokemonStat[];
  artwork: PokemonArtwork;
  generation: PokemonGeneration;
  abilities: PokemonAbility[];
  descriptions: PokemonDescription[];
  baseExperience: number | null;
}

export interface EvolutionMethod {
  method: string;
  trigger: string;
  conditions: string[];
  versionGroup: string | null;
  raw: Record<string, unknown>;
}

export interface EvolutionNode {
  id: number;
  name: string;
  isBaby: boolean;
  displayName: string;
  evolvesTo: number[];
  evolvesFrom: number | null;
}

export interface EvolutionEdge {
  to: number;
  from: number;
  methods: EvolutionMethod[];
}

export interface PokemonEvolution {
  id: number;
  nodes: EvolutionNode[];
  edges: EvolutionEdge[];
  babyTriggerItem: string | null;
  scope: 'generations-1-4';
  note: string;
}

export interface PokemonDetail extends PokemonCard {
  isBaby: boolean;
  isMythical: boolean;
  isLegendary: boolean;
  genderRate: number;
  captureRate: number;
  baseHappiness: number | null;
  habitat: string | null;
  eggGroups: string[];
  growthRate: string;
  evolutions: PokemonEvolution;
}

export interface PokemonListQuery {
  q?: string;
  shiny?: boolean;
  limit?: number;
  offset?: number;
  type?: PokemonType | 'all';
  generation?: PokemonGeneration | 'all';
}

export interface ApiPagination {
  total: number;
  limit: number;
  offset: number;
  next: number | null;
  previous: number | null;
}

export interface ApiMeta {
  version: 'v1';
  source: 'PokéAPI';
  timestamp: string;
  storageMode: 'server-memory-cache';
  limits: { species: 493; generations: number[]; maxPageSize: number };
  pagination?: ApiPagination;
  filters?: PokemonListQuery;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  retryAfterSeconds?: number;
}

export type ApiEnvelope<T> = {
  meta: ApiMeta;
  requestId: string;
} & (
  | { success: true; data: T; error?: never }
  | { success: false; data: null; error: ApiError }
);

export type PokemonLoadState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: T | null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: T | null; error: string };
