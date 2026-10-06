import { authService } from '../authentication/service';
import { userScope } from '../authentication/userScope';
import { createIdentity } from '../common/ids';
import { cleanName, isRecord } from '../common/values';
import { storage, queueStorage } from '../common/storage';
import { Team, TeamPokemon, TeamRecord } from '../models';
import { TeamCapacity, VoteValue } from '../../types/types';
import { TrainerSnapshot, VoteLedger } from './types';

const ledgerKey = `private:trainer-votes`;
const validPokemon = (value: unknown): value is TeamPokemon => isRecord(value)
  && Number.isInteger(value.id) && Number(value.id) >= 1 && Number(value.id) <= 493
  && typeof value.name === `string` && value.name.length > 0 && value.name.length <= 100
  && typeof value.image === `string` && (/^https:\/\//.test(value.image) || /^\/(media|assets)\/[a-zA-Z0-9_/-]+\.(png|webp|jpe?g|gif)$/.test(value.image))
  && Array.isArray(value.types) && value.types.every((type) => typeof type === `string`);
const validTeams = (value: unknown): value is TeamRecord[] => Array.isArray(value) && value.every((entry) => isRecord(entry)
  && typeof entry.id === `string` && Number.isSafeInteger(entry.number)
  && typeof entry.name === `string` && typeof entry.userId === `string`
  && [3, 6, 10].includes(Number(entry.capacity)) && typeof entry.createdAt === `string`
  && typeof entry.updatedAt === `string` && Array.isArray(entry.pokemon)
  && entry.pokemon.length <= Number(entry.capacity) && entry.pokemon.every(validPokemon));
const validLedger = (value: unknown): value is VoteLedger => isRecord(value) && Object.values(value).every((votes) => isRecord(votes)
  && Object.entries(votes).every(([id, vote]) => /^\d+$/.test(id) && Number(id) >= 1 && Number(id) <= 493 && (vote === -1 || vote === 0 || vote === 1)));
const readTeams = async (userId: string) => (await storage.get(userScope(userId, `teams`), validTeams) ?? []).map((team) => new Team({
  ...team,
  pokemon: team.pokemon.map((pokemon) => ({ ...pokemon, image: pokemon.image.replace(/^\/assets\//, `/media/`) })),
}).toRecord());
const readLedger = async () => await storage.get(ledgerKey, validLedger) ?? {};
const sumVotes = (ledger: VoteLedger) => {
  const totals: Record<number, number> = {};
  Object.values(ledger).forEach((votes) => Object.entries(votes).forEach(([id, vote]) => { totals[Number(id)] = (totals[Number(id)] ?? 0) + vote; }));
  return totals;
};

export const trainerService = {
  async getSnapshot(): Promise<TrainerSnapshot> {
    const user = await authService.getCurrentUser();
    const ledger = await readLedger();
    return { accountId: user?.id ?? null, teams: user ? await readTeams(user.id) : [], votes: user ? ledger[user.id] ?? {} : {}, voteTotals: sumVotes(ledger) };
  },
  async createTeam(name: string, capacity: TeamCapacity, expectedUserId?: string): Promise<TeamRecord> {
    const title = cleanName(name);
    if (title.length < 2 || title.length > 40) throw new Error(`Team Name Must Be 2–40 Characters`);
    if (![3, 6, 10].includes(capacity)) throw new Error(`Choose A 3, 6, Or 10 Pokémon Team`);
    return queueStorage(`account-data`, async () => {
      const user = await authService.requireUser(expectedUserId);
      const identity = await createIdentity(`Team`, title);
      const now = new Date().toISOString();
      const team = new Team({ ...identity, name: title, capacity, userId: user.id, pokemon: [], createdAt: now, updatedAt: now }).toRecord();
      await storage.set(userScope(user.id, `teams`), [...await readTeams(user.id), team]);
      return team;
    });
  },
  async addPokemon(teamId: string, pokemon: TeamPokemon, expectedUserId?: string): Promise<TeamRecord> {
    if (!validPokemon(pokemon)) throw new Error(`Choose A Generation I–IV Pokémon`);
    return queueStorage(`account-data`, async () => {
      const user = await authService.requireUser(expectedUserId);
      const teams = await readTeams(user.id);
      const team = teams.find((entry) => entry.id === teamId && entry.userId === user.id);
      if (!team) throw new Error(`Team Could Not Be Found`);
      if (team.pokemon.some((entry) => entry.id === pokemon.id)) throw new Error(`This Pokémon Is Already On The Team`);
      if (team.pokemon.length >= team.capacity) throw new Error(`This Team Is Full`);
      const updated = new Team({ ...team, pokemon: [...team.pokemon, { id: pokemon.id, name: pokemon.name, image: pokemon.image, types: [...pokemon.types] }], updatedAt: new Date().toISOString() }).toRecord();
      await storage.set(userScope(user.id, `teams`), teams.map((entry) => entry.id === teamId ? updated : entry));
      return updated;
    });
  },
  async removePokemon(teamId: string, pokemonId: number, expectedUserId?: string): Promise<void> {
    return queueStorage(`account-data`, async () => {
      const user = await authService.requireUser(expectedUserId);
      const teams = await readTeams(user.id);
      const team = teams.find((entry) => entry.id === teamId && entry.userId === user.id);
      if (!team) throw new Error(`Team Could Not Be Found`);
      const updated = new Team({ ...team, pokemon: team.pokemon.filter((entry) => entry.id !== pokemonId), updatedAt: new Date().toISOString() }).toRecord();
      await storage.set(userScope(user.id, `teams`), teams.map((entry) => entry.id === teamId ? updated : entry));
    });
  },
  async deleteTeam(teamId: string, expectedUserId?: string): Promise<void> {
    return queueStorage(`account-data`, async () => {
      const user = await authService.requireUser(expectedUserId);
      const teams = await readTeams(user.id);
      if (!teams.some((entry) => entry.id === teamId && entry.userId === user.id)) throw new Error(`Team Could Not Be Found`);
      await storage.set(userScope(user.id, `teams`), teams.filter((entry) => entry.id !== teamId));
    });
  },
  async toggleVote(pokemonId: number, value: 1 | -1, expectedUserId?: string): Promise<VoteValue> {
    if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > 493 || (value !== 1 && value !== -1)) throw new Error(`Choose A Valid Pokémon Vote`);
    return queueStorage(`account-data`, async () => {
      const user = await authService.requireUser(expectedUserId);
      const ledger = await readLedger();
      const votes = ledger[user.id] ?? {};
      const next: VoteValue = votes[pokemonId] === value ? 0 : value;
      await storage.set(ledgerKey, { ...ledger, [user.id]: { ...votes, [pokemonId]: next } });
      return next;
    });
  },
};
