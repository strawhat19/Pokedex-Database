import { Data, DataRecord } from '../Data';
import { TeamCapacity } from '../../../types/types';

export interface TeamPokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
}

export interface TeamRecord extends DataRecord {
  name: string;
  userId: string;
  capacity: TeamCapacity;
  pokemon: TeamPokemon[];
}

export class Team extends Data implements TeamRecord {
  name: string;
  userId: string;
  capacity: TeamCapacity;
  pokemon: TeamPokemon[];
  constructor(record: TeamRecord) {
    super(record);
    this.name = record.name;
    this.userId = record.userId;
    this.capacity = record.capacity;
    this.pokemon = record.pokemon;
  }
  toRecord(): TeamRecord { return { ...super.toRecord(), name: this.name, userId: this.userId, capacity: this.capacity, pokemon: this.pokemon.map(({ id, name, image, types }) => ({ id, name, image, types: [...types] })) }; }
}
