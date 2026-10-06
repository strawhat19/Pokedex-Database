import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trainerService } from './service';
import { authAPI } from '../../api/auth';
import { TrainerSnapshot } from './types';
import { TeamPokemon, TeamRecord } from '../models';
import { useAuth } from '../authContext/useAuth';
import { errorMessage } from '../common/values';
import { TeamCapacity, VoteValue } from '../../types/types';

export interface TrainerContextValue extends TrainerSnapshot {
  loading: boolean;
  error: string | null;
  createTeam: (name: string, capacity: TeamCapacity) => Promise<TeamRecord>;
  addPokemon: (teamId: string, pokemon: TeamPokemon) => Promise<TeamRecord>;
  removePokemon: (teamId: string, pokemonId: number) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  toggleVote: (pokemonId: number, value: 1 | -1) => Promise<VoteValue>;
}

const empty: TrainerSnapshot = { accountId: null, teams: [], votes: {}, voteTotals: {} };
export const TrainerContext = createContext<TrainerContextValue | null>(null);

export const TrainerProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [snapshot, setSnapshot] = useState<TrainerSnapshot>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const account = useRef(user?.id);
  const refreshSequence = useRef(0);
  account.current = user?.id;
  const refresh = useCallback(async () => {
    const currentId = account.current;
    const request = ++refreshSequence.current;
    try {
      const next = await trainerService.getSnapshot();
      if (request === refreshSequence.current && currentId === account.current && next.accountId === (currentId ?? null)) { setSnapshot(next); setError(null); }
    } catch (failure) { if (request === refreshSequence.current && currentId === account.current) { setSnapshot({ ...empty, accountId: currentId ?? null }); setError(errorMessage(failure)); } }
    finally { if (request === refreshSequence.current && currentId === account.current) setLoading(false); }
  }, []);
  useEffect(() => {
    refreshSequence.current += 1;
    setSnapshot(empty);
    setError(null);
    setLoading(true);
    if (!authLoading) void refresh();
  }, [user?.id, authLoading, refresh]);
  useEffect(() => {
    if (typeof window === `undefined`) return;
    const onStorage = () => void refresh();
    window.addEventListener(`storage`, onStorage);
    return () => window.removeEventListener(`storage`, onStorage);
  }, [refresh]);
  const mutate = useCallback(async <T,>(operation: (actorId: string) => Promise<T>) => {
    const actorId = account.current ?? (await authAPI.getCurrentUser())?.id;
    if (!actorId) throw new Error(`Sign In To Become A Trainer`);
    try { const result = await operation(actorId); await refresh(); return result; }
    catch (failure) { if (account.current === actorId) setError(errorMessage(failure)); throw failure; }
  }, [refresh]);
  const value = useMemo<TrainerContextValue>(() => ({
    ...(snapshot.accountId === (user?.id ?? null) ? snapshot : { ...empty, voteTotals: snapshot.voteTotals }),
    loading: loading || snapshot.accountId !== (user?.id ?? null),
    error: snapshot.accountId === (user?.id ?? null) ? error : null,
    deleteTeam: (id) => mutate((actorId) => trainerService.deleteTeam(id, actorId)),
    createTeam: (name, capacity) => mutate((actorId) => trainerService.createTeam(name, capacity, actorId)),
    addPokemon: (id, pokemon) => mutate((actorId) => trainerService.addPokemon(id, pokemon, actorId)),
    removePokemon: (id, pokemonId) => mutate((actorId) => trainerService.removePokemon(id, pokemonId, actorId)),
    toggleVote: (pokemonId, vote) => mutate((actorId) => trainerService.toggleVote(pokemonId, vote, actorId)),
  }), [user?.id, snapshot, loading, error, mutate]);
  return <TrainerContext.Provider value={value}>{children}</TrainerContext.Provider>;
};
