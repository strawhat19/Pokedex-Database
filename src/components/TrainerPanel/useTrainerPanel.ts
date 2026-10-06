import { useEffect, useRef, useState } from 'react';
import { authAPI } from '../../api/auth';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTrainer } from '../../shared/teams/useTrainer';
import { errorMessage } from '../../shared/common/values';
import { TeamCapacity } from '../../types/types';
import { TrainerPanelProps, TrainerPanelView } from './types';

export const useTrainerPanel = (props: TrainerPanelProps) => {
  const auth = useAuth();
  const trainer = useTrainer();
  const [view, setView] = useState(props.view);
  const [name, setName] = useState(``);
  const [email, setEmail] = useState(``);
  const [password, setPassword] = useState(``);
  const [trainerId, setTrainerId] = useState(`red`);
  const [teamName, setTeamName] = useState(``);
  const [capacity, setCapacity] = useState<TeamCapacity>(6);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(``);
  const [failure, setFailure] = useState(``);
  const currentAccount = useRef(auth.user?.id);
  const currentView = useRef(props.view);
  currentAccount.current = auth.user?.id;
  currentView.current = props.view;

  useEffect(() => { setView(props.view); setNotice(``); setFailure(``); setPassword(``); }, [props.view]);
  useEffect(() => {
    setBusy(false); setNotice(``); setFailure(``); setPassword(``); setTeamName(``); setCapacity(6);
    if (!auth.user) { setName(``); setEmail(``); setTrainerId(`red`); }
  }, [auth.user?.id]);
  useEffect(() => {
    if (!auth.user) return;
    setName(auth.user.name);
    setTrainerId(auth.user.trainerId);
    let current = true;
    void authAPI.getAccount().then((account) => { if (current) setEmail(account.email); }).catch(() => undefined);
    return () => { current = false; };
  }, [auth.user?.id, auth.user?.name, auth.user?.trainerId]);
  const changeView = (next: TrainerPanelView) => {
    setView(next); setNotice(``); setFailure(``); setPassword(``); props.onViewChange?.(next);
  };
  const run = async (operation: () => Promise<unknown>, success?: string, allowAccountTransition = false) => {
    const actorId = currentAccount.current;
    setBusy(true); setFailure(``); setNotice(``);
    try { const result = await operation(); if (success && (allowAccountTransition || actorId === currentAccount.current)) setNotice(success); return result; }
    catch (error) { if (allowAccountTransition || actorId === currentAccount.current) setFailure(errorMessage(error)); return undefined; }
    finally { if (allowAccountTransition || actorId === currentAccount.current) setBusy(false); }
  };
  const submitAccount = async () => {
    const requestedView = currentView.current;
    const selectedTrainerId = trainerId;
    await run(async () => {
      if (view === `profile`) { await auth.updateProfile({ name, trainerId }); return; }
      if (view === `signup`) await auth.signUp({ name, email, password, trainerId });
      else {
        const signedUser = await auth.signIn({ email, password });
        setPassword(``);
        await auth.updateProfile({ name: signedUser.name, trainerId: selectedTrainerId });
      }
      setPassword(``);
      if (requestedView !== currentView.current) return;
      if (props.onAuthenticated) await props.onAuthenticated();
      else changeView(props.pendingPokemon ? `teams` : `profile`);
    }, view === `profile` ? `Trainer Profile Updated` : `Welcome, Trainer`, view !== `profile`);
  };
  const createTeam = async () => {
    await run(async () => { const team = await trainer.createTeam(teamName, capacity); setTeamName(``); return team; }, `Team Created`);
  };
  const addToTeam = async (teamId: string) => {
    if (props.pendingPokemon) await run(() => trainer.addPokemon(teamId, props.pendingPokemon!), `${props.pendingPokemon.name} Added To Team`);
  };
  const signOut = async () => { await run(async () => { await auth.signOut(); props.onClose(); }); };

  return {
    ...auth, ...trainer, loading: auth.loading || trainer.loading,
    view, name, email, password, trainerId, teamName, capacity, busy, notice, failure,
    setName, setEmail, setPassword, setTrainerId, setTeamName, setCapacity, changeView, submitAccount, createTeam, addToTeam, signOut,
    removeFromTeam: (teamId: string, pokemonId: number) => run(() => trainer.removePokemon(teamId, pokemonId), `Pokémon Removed`),
    deleteSavedTeam: (teamId: string) => run(() => trainer.deleteTeam(teamId), `Team Deleted`),
  };
};
