export interface NamedResource {
  name: string;
  url: string;
}

export interface PokePokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  species: NamedResource;
  base_experience: number | null;
  types: Array<{ slot: number; type: NamedResource }>;
  stats: Array<{ effort: number; base_stat: number; stat: NamedResource }>;
  abilities: Array<{ slot: number; is_hidden: boolean; ability: NamedResource }>;
  sprites: {
    front_shiny: string | null;
    front_default: string | null;
    other?: {
      'official-artwork'?: {
        front_shiny: string | null;
        front_default: string | null;
      };
    };
  };
}

export interface PokeSpecies {
  id: number;
  name: string;
  is_baby: boolean;
  is_mythical: boolean;
  is_legendary: boolean;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number | null;
  generation: NamedResource;
  growth_rate: NamedResource;
  habitat: NamedResource | null;
  evolution_chain: { url: string };
  egg_groups: NamedResource[];
  names: Array<{ name: string; language: NamedResource }>;
  genera: Array<{ genus: string; language: NamedResource }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    version: NamedResource;
    language: NamedResource;
  }>;
}

export interface PokeEvolutionDetail extends Record<string, unknown> {
  gender: number | null;
  min_level: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  min_happiness: number | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  turn_upside_down: boolean;
  needs_overworld_rain: boolean;
  item: NamedResource | null;
  trigger: NamedResource;
  held_item: NamedResource | null;
  known_move: NamedResource | null;
  known_move_type: NamedResource | null;
  location: NamedResource | null;
  party_species: NamedResource | null;
  party_type: NamedResource | null;
  trade_species: NamedResource | null;
  version_group?: NamedResource | null;
  region?: NamedResource | null;
  used_move?: NamedResource | null;
  min_move_count?: number | null;
  min_steps?: number | null;
  min_damage_taken?: number | null;
  min_item_count?: number | null;
  needs_multiplayer?: boolean;
  near_special_rock?: boolean;
  required_pokemon_form?: NamedResource | null;
  evolved_pokemon_form?: NamedResource | null;
}

export interface PokeChainLink {
  is_baby: boolean;
  species: NamedResource;
  evolves_to: PokeChainLink[];
  evolution_details: PokeEvolutionDetail[];
}

export interface PokeEvolutionChain {
  id: number;
  chain: PokeChainLink;
  baby_trigger_item: NamedResource | null;
}

export interface PokeList {
  count: number;
  results: NamedResource[];
}

export interface PokeType {
  pokemon: Array<{ slot: number; pokemon: NamedResource }>;
}
