import { ApiFailure, fetchPokeAPI } from './upstream';
import { pokemonTypes } from '../shared/pokemon/types';
import type {
  PokeList,
  PokeType,
  PokeSpecies,
  PokePokemon,
  PokeChainLink,
  NamedResource,
  PokeEvolutionChain,
  PokeEvolutionDetail,
} from './pokeapiTypes';
import type {
  PokemonCard,
  PokemonType,
  EvolutionNode,
  EvolutionEdge,
  PokemonDetail,
  EvolutionMethod,
  PokemonEvolution,
  PokemonListQuery,
  PokemonGeneration,
  PokemonDescription,
} from '../shared/pokemon/types';

const supportedSpecies = 493;
export const maximumPageSize = 24;
const generations: Array<[number, number, PokemonGeneration]> = [
  [1, 151, 1], [152, 251, 2], [252, 386, 3], [387, 493, 4],
];
const gameVersions = [
  'heartgold', 'soulsilver', 'platinum', 'diamond', 'pearl', 'firered',
  'leafgreen', 'emerald', 'ruby', 'sapphire', 'crystal', 'gold', 'silver',
  'yellow', 'red', 'blue',
];

export const resourceID = (resource: NamedResource | { url: string }): number =>
  Number(resource.url.match(/\/(\d+)\/?$/)?.[1]);

const displayName = (name: string) => name
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const normalizedSearch = (value: string) => value
  .toLowerCase()
  .replace(/♀/g, '-f')
  .replace(/♂/g, '-m')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

const cleanText = (text: string) => text.replace(/[\n\r\f]+/g, ' ').replace(/\s+/g, ' ').trim();

const generationFor = (id: number): PokemonGeneration => {
  const generation = generations.find(([from, to]) => id >= from && id <= to)?.[2];
  if (!generation) throw new ApiFailure('OUT_OF_SCOPE', 'Only generations 1–4 are available', 404);
  return generation;
};

const englishDescriptions = (species: PokeSpecies): PokemonDescription[] => {
  const seen = new Set<string>();
  return species.flavor_text_entries
    .filter((entry) => entry.language.name === 'en' && gameVersions.includes(entry.version.name))
    .sort((a, b) => gameVersions.indexOf(a.version.name) - gameVersions.indexOf(b.version.name))
    .flatMap((entry) => {
      const text = cleanText(entry.flavor_text);
      const key = `${entry.version.name}:${text}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ text, language: 'en' as const, version: entry.version.name }];
    });
};

const normalizePokemon = (pokemon: PokePokemon, species: PokeSpecies): PokemonCard => {
  const descriptions = englishDescriptions(species);
  const artwork = pokemon.sprites.other?.['official-artwork'];
  return {
    id: species.id,
    name: species.name,
    weightKg: pokemon.weight / 10,
    heightMeters: pokemon.height / 10,
    generation: generationFor(species.id),
    description: descriptions[0]?.text ?? '',
    baseExperience: pokemon.base_experience,
    displayName: species.names.find((entry) => entry.language.name === 'en')?.name ?? displayName(species.name),
    category: species.genera.find((entry) => entry.language.name === 'en')?.genus ?? '',
    artwork: {
      shiny: artwork?.front_shiny ?? null,
      default: artwork?.front_default ?? null,
      sprite: pokemon.sprites.front_default,
      shinySprite: pokemon.sprites.front_shiny,
    },
    descriptions,
    types: [...pokemon.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name as PokemonType),
    stats: pokemon.stats.map((entry) => ({ name: entry.stat.name, value: entry.base_stat, effort: entry.effort })),
    abilities: pokemon.abilities.map((entry) => ({ name: entry.ability.name, slot: entry.slot, isHidden: entry.is_hidden })),
  };
};

const getPokemonResources = async (id: number) => {
  generationFor(id);
  const [pokemon, species] = await Promise.all([
    fetchPokeAPI<PokePokemon>(`pokemon/${id}/`),
    fetchPokeAPI<PokeSpecies>(`pokemon-species/${id}/`),
  ]);
  return { pokemon, species };
};

const optionalInteger = (value: string | null, name: string, minimum: number, maximum: number, fallback: number) => {
  if (value === null || value === '') return fallback;
  if (!/^\d+$/.test(value)) throw new ApiFailure('INVALID_QUERY', `${name} must be a whole number`, 400);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new ApiFailure('INVALID_QUERY', `${name} must be between ${minimum} and ${maximum}`, 400);
  }
  return parsed;
};

export const parsePokemonQuery = (url: URL): Required<PokemonListQuery> => {
  const params = url.searchParams;
  const generationValue = params.get('generation');
  const typeValue = params.get('type')?.toLowerCase() || 'all';
  const shinyValue = params.get('shiny');
  const generation = !generationValue || generationValue === 'all'
    ? 'all'
    : optionalInteger(generationValue, 'generation', 1, 4, 1) as PokemonGeneration;
  if (typeValue !== 'all' && !pokemonTypes.includes(typeValue as PokemonType)) {
    throw new ApiFailure('INVALID_QUERY', 'Choose a valid Pokémon type', 400);
  }
  if (shinyValue !== null && !['true', 'false', '1', '0'].includes(shinyValue)) {
    throw new ApiFailure('INVALID_QUERY', 'shiny must be true or false', 400);
  }
  const q = (params.get('q') ?? '').trim();
  if (q.length > 80) throw new ApiFailure('INVALID_QUERY', 'Search must be 80 characters or fewer', 400);
  return {
    q,
    generation,
    type: typeValue as PokemonType | 'all',
    shiny: shinyValue === 'true' || shinyValue === '1',
    offset: optionalInteger(params.get('offset'), 'offset', 0, supportedSpecies, 0),
    limit: optionalInteger(params.get('limit'), 'limit', 1, maximumPageSize, 12),
  };
};

export const listPokemon = async (query: Required<PokemonListQuery>) => {
  const [index, typeResource] = await Promise.all([
    fetchPokeAPI<PokeList>(`pokemon-species/?limit=${supportedSpecies}&offset=0`),
    query.type !== 'all' ? fetchPokeAPI<PokeType>(`type/${query.type}/`) : Promise.resolve(null),
  ]);
  const typeIDs = typeResource ? new Set(typeResource.pokemon.map((entry) => resourceID(entry.pokemon))) : null;
  const search = normalizedSearch(query.q);
  const numericMatch = /^#?(\d+)$/.exec(query.q);
  const numericID = numericMatch ? Number(numericMatch[1]) : null;
  const matches = index.results.filter((entry) => {
    const id = resourceID(entry);
    return id >= 1 && id <= supportedSpecies
      && (query.generation === 'all' || generationFor(id) === query.generation)
      && (!typeIDs || typeIDs.has(id))
      && (!search || (numericID !== null ? id === numericID : normalizedSearch(entry.name).includes(search)));
  });
  const page = matches.slice(query.offset, query.offset + query.limit);
  const cards = await Promise.all(page.map(async (entry) => {
    const { pokemon, species } = await getPokemonResources(resourceID(entry));
    return normalizePokemon(pokemon, species);
  }));
  return {
    data: cards,
    pagination: {
      limit: query.limit,
      total: matches.length,
      offset: query.offset,
      previous: query.offset > 0 ? Math.max(0, query.offset - query.limit) : null,
      next: query.offset + query.limit < matches.length ? query.offset + query.limit : null,
    },
  };
};

const evolutionMethod = (detail: PokeEvolutionDetail): EvolutionMethod => {
  const conditions: string[] = [];
  const trigger = detail.trigger?.name ?? 'unknown';
  let method = displayName(trigger);
  if (trigger === 'level-up') method = detail.min_level != null ? `Reach level ${detail.min_level}` : 'Level up';
  if (trigger === 'use-item' && detail.item) method = `Use ${displayName(detail.item.name)}`;
  if (trigger === 'trade') method = 'Trade';
  if (trigger === 'shed') method = 'Special shed evolution';
  if (detail.item && trigger !== 'use-item') conditions.push(`Use ${displayName(detail.item.name)}`);
  if (detail.min_level != null && trigger !== 'level-up') conditions.push(`Level ${detail.min_level} or higher`);
  if (detail.held_item) conditions.push(`Holding ${displayName(detail.held_item.name)}`);
  if (detail.min_happiness != null) conditions.push(`Friendship at least ${detail.min_happiness}`);
  if (detail.min_beauty != null) conditions.push(`Beauty at least ${detail.min_beauty}`);
  if (detail.min_affection != null) conditions.push(`Affection at least ${detail.min_affection}`);
  if (detail.gender != null) conditions.push(detail.gender === 1 ? 'Female Pokémon' : detail.gender === 2 ? 'Male Pokémon' : 'Genderless Pokémon');
  if (detail.time_of_day) conditions.push(`During ${detail.time_of_day}`);
  if (detail.known_move) conditions.push(`Knows ${displayName(detail.known_move.name)}`);
  if (detail.known_move_type) conditions.push(`Knows a ${displayName(detail.known_move_type.name)} type move`);
  if (detail.location) conditions.push(`At ${displayName(detail.location.name)}`);
  if (detail.party_species) conditions.push(`${displayName(detail.party_species.name)} in your party`);
  if (detail.party_type) conditions.push(`${displayName(detail.party_type.name)} type Pokémon in your party`);
  if (detail.trade_species) conditions.push(`Trade for ${displayName(detail.trade_species.name)}`);
  if (detail.relative_physical_stats != null) {
    conditions.push(detail.relative_physical_stats === 1 ? 'Attack greater than Defense' : detail.relative_physical_stats === -1 ? 'Attack less than Defense' : 'Attack equals Defense');
  }
  if (detail.needs_overworld_rain) conditions.push('Rain in the overworld');
  if (detail.turn_upside_down) conditions.push('Turn the device upside down');
  if (detail.needs_multiplayer) conditions.push('Multiplayer required');
  if (detail.near_special_rock) conditions.push('Near a special rock');
  if (detail.region) conditions.push(`In ${displayName(detail.region.name)}`);
  if (detail.required_pokemon_form) conditions.push(`In ${displayName(detail.required_pokemon_form.name)} form`);
  if (detail.evolved_pokemon_form) conditions.push(`Evolves into ${displayName(detail.evolved_pokemon_form.name)} form`);
  if (detail.used_move) conditions.push(`Use ${displayName(detail.used_move.name)}`);
  if (detail.min_move_count != null) conditions.push(`Use the required move at least ${detail.min_move_count} times`);
  if (detail.min_steps != null) conditions.push(`Walk at least ${detail.min_steps} steps`);
  if (detail.min_damage_taken != null) conditions.push(`Take at least ${detail.min_damage_taken} damage`);
  if (detail.min_item_count != null) conditions.push(`Use at least ${detail.min_item_count} required items`);
  return {
    method,
    trigger,
    conditions,
    raw: { ...detail },
    versionGroup: detail.version_group?.name ?? null,
  };
};

const normalizeEvolution = (chain: PokeEvolutionChain): PokemonEvolution => {
  const nodes: EvolutionNode[] = [];
  const edges: EvolutionEdge[] = [];
  const visit = (link: PokeChainLink, parent: number | null) => {
    const id = resourceID(link.species);
    if (!Number.isSafeInteger(id) || id < 1 || id > supportedSpecies) return;
    const children = link.evolves_to.filter((child) => resourceID(child.species) <= supportedSpecies);
    nodes.push({
      id,
      name: link.species.name,
      isBaby: link.is_baby,
      evolvesFrom: parent,
      displayName: displayName(link.species.name),
      evolvesTo: children.map((child) => resourceID(child.species)),
    });
    if (parent !== null) {
      const details = link.evolution_details.filter((detail) => !detail.version_group || resourceID(detail.version_group) <= 10);
      edges.push({ to: id, from: parent, methods: details.map(evolutionMethod) });
    }
    children.forEach((child) => visit(child, id));
  };
  visit(chain.chain, null);
  return {
    id: chain.id,
    nodes,
    edges,
    scope: 'generations-1-4',
    babyTriggerItem: chain.baby_trigger_item?.name ?? null,
    note: 'Species are limited to generations 1–4. Versioned methods are limited to games through HeartGold/SoulSilver. Unversioned methods and special triggers can require additional game-specific steps not provided by PokéAPI. Consult your game version; all supplied constraints are retained in raw.',
  };
};

export const resolvePokemonID = async (value: string): Promise<number> => {
  const identifier = value.trim();
  const numericMatch = /^#?(\d+)$/.exec(identifier);
  if (numericMatch) {
    const id = Number(numericMatch[1]);
    generationFor(id);
    return id;
  }
  if (identifier.length > 80) throw new ApiFailure('NOT_FOUND', 'That Pokémon was not found', 404);
  const index = await fetchPokeAPI<PokeList>(`pokemon-species/?limit=${supportedSpecies}&offset=0`);
  const entry = index.results.find((pokemon) => normalizedSearch(pokemon.name) === normalizedSearch(identifier));
  if (!entry) throw new ApiFailure('NOT_FOUND', 'That Pokémon was not found in generations 1–4', 404);
  return resourceID(entry);
};

export const getPokemonEvolution = async (id: number): Promise<PokemonEvolution> => {
  generationFor(id);
  const species = await fetchPokeAPI<PokeSpecies>(`pokemon-species/${id}/`);
  const chain = await fetchPokeAPI<PokeEvolutionChain>(species.evolution_chain.url);
  return normalizeEvolution(chain);
};

export const getPokemonDetail = async (id: number): Promise<PokemonDetail> => {
  const { pokemon, species } = await getPokemonResources(id);
  const evolutions = await getPokemonEvolution(id);
  return {
    ...normalizePokemon(pokemon, species),
    evolutions,
    isBaby: species.is_baby,
    isMythical: species.is_mythical,
    isLegendary: species.is_legendary,
    habitat: species.habitat?.name ?? null,
    genderRate: species.gender_rate,
    captureRate: species.capture_rate,
    growthRate: species.growth_rate.name,
    baseHappiness: species.base_happiness,
    eggGroups: species.egg_groups.map((group) => group.name),
  };
};
