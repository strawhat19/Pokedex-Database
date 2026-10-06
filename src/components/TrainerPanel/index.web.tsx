import React, { useEffect, useRef } from 'react';
import { trainerModels } from '../../shared/trainers';
import { TrainerPanelProps } from './types';
import { useTrainerPanel } from './useTrainerPanel';
import { TeamCapacity } from '../../types/types';
import './styles.scss';

const titles = { signin: `Welcome back, Trainer.`, signup: `Your journey starts here.`, profile: `Your Trainer Passport.`, teams: `A team for every adventure.` };

const TrainerPanel = (props: TrainerPanelProps) => {
  const panel = useTrainerPanel(props);
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(props.onClose);
  closeRef.current = props.onClose;
  useEffect(() => {
    if (!props.view) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = `hidden`;
    const focusables = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>(`button:not(:disabled), input:not(:disabled), select, a[href], [tabindex="0"]`) ?? []);
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === `Escape`) closeRef.current();
      if (event.key !== `Tab`) return;
      const elements = focusables();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener(`keydown`, onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener(`keydown`, onKey); previous?.focus(); };
  }, [Boolean(props.view)]);
  if (!props.view || !panel.view) return null;
  const showName = panel.view === `signup` || panel.view === `profile`;
  const showTrainerPicker = panel.view === `signin` || panel.view === `signup` || panel.view === `profile`;
  const profileView = panel.view === `profile`;
  const teamsView = panel.view === `teams`;

  return (
    <div id="trainer-panel-overlay" className="trainer-panel-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose(); }}>
      <div id="trainer-panel-dialog" ref={dialog} className="trainer-panel" role="dialog" aria-modal="true" aria-labelledby="trainer-panel-title">
        <header id="trainer-panel-header" className="trainer-panel__header">
          <div className="trainer-panel__eyebrow"><span className="trainer-panel__status-dot" /> TRAINER ACCESS</div>
          <button id="trainer-panel-close" className="trainer-panel__close" type="button" aria-label="Close trainer panel" onClick={props.onClose}>×</button>
        </header>
        <h2 id="trainer-panel-title">{titles[panel.view]}</h2>
        <p className="trainer-panel__intro">{teamsView ? props.pendingPokemon ? `Choose a home for ${props.pendingPokemon.name}.` : `Save your favorites. Build your next winning lineup.` : profileView ? `Choose your character and make this Pokédex yours.` : `Keep your teams, favorite Pokémon, and votes together.`}</p>
        {panel.user && <nav id="trainer-panel-tabs" className="trainer-panel__tabs" aria-label="Trainer account">
          <button id="trainer-profile-tab" type="button" className={profileView ? `is-active` : ``} onClick={() => panel.changeView(`profile`)}>◉ Profile</button>
          <button id="trainer-teams-tab" type="button" className={teamsView ? `is-active` : ``} onClick={() => panel.changeView(`teams`)}>⊞ My Teams <span>{panel.teams.length}</span></button>
        </nav>}
        {(panel.loading || (panel.user && panel.error)) && <p className="trainer-panel__notice" role="status">{panel.loading ? `Loading Trainer Data…` : panel.error}</p>}
        {panel.failure && <p id="trainer-panel-error" className="trainer-panel__feedback is-error" role="alert">{panel.failure}</p>}
        {panel.notice && <p id="trainer-panel-notice" className="trainer-panel__feedback" role="status">✓ {panel.notice}</p>}
        {(teamsView || profileView) && panel.loading ? <div id="trainer-private-loading" className="trainer-panel__skeleton" aria-label="Loading trainer account" aria-busy="true"><div /><div /><div /></div> : teamsView && panel.user ? <div id="trainer-teams-content" className="trainer-panel__teams">
          {props.pendingPokemon && <div className="trainer-panel__pending"><img src={props.pendingPokemon.image} alt={props.pendingPokemon.name} /><div><small>READY TO ADD</small><strong>{props.pendingPokemon.name}</strong></div><span>#{String(props.pendingPokemon.id).padStart(3, `0`)}</span></div>}
          <form id="trainer-create-team-form" className="trainer-panel__team-form" onSubmit={(event) => { event.preventDefault(); void panel.createTeam(); }}>
            <label htmlFor="trainer-team-name">Team Name<input id="trainer-team-name" value={panel.teamName} placeholder="My Kanto team" maxLength={40} required minLength={2} onChange={(event) => panel.setTeamName(event.target.value)} /></label>
            <label htmlFor="trainer-team-capacity">Team Size<select id="trainer-team-capacity" value={panel.capacity} onChange={(event) => panel.setCapacity(Number(event.target.value) as TeamCapacity)}><option value={3}>3 Pokémon</option><option value={6}>6 Pokémon</option><option value={10}>10 Pokémon</option></select></label>
            <button id="trainer-create-team" className="trainer-panel__primary" disabled={panel.busy} type="submit">＋ Create Team</button>
          </form>
          {!panel.teams.length && !panel.loading && <div className="trainer-panel__empty"><span>⊞</span><strong>Your adventure needs a team.</strong><p>Create your first team above, then add Pokémon from the Pokédex.</p></div>}
          {panel.teams.map((team) => <section id={`trainer-team-${team.id}`} className="trainer-panel__team" key={team.id}>
            <div className="trainer-panel__team-heading"><div><h3>{team.name}</h3><small>{team.pokemon.length} / {team.capacity} Pokémon</small></div><button id={`trainer-delete-team-${team.id}`} type="button" className="trainer-panel__text-button" disabled={panel.busy} onClick={() => void panel.deleteSavedTeam(team.id)} aria-label={`Delete ${team.name}`}>× Delete</button></div>
            <div className="trainer-panel__team-slots">{Array.from({ length: team.capacity }, (_, index) => {
              const pokemon = team.pokemon[index];
              return <div id={`trainer-team-slot-${team.id}-${index}`} className={`trainer-panel__slot ${pokemon ? `is-filled` : ``}`} key={index}>{pokemon ? <><img src={pokemon.image} alt={pokemon.name} /><span>{pokemon.name}</span><button id={`trainer-remove-${team.id}-${pokemon.id}`} type="button" disabled={panel.busy} aria-label={`Remove ${pokemon.name} from ${team.name}`} onClick={() => void panel.removeFromTeam(team.id, pokemon.id)}>×</button></> : <span className="trainer-panel__slot-plus">＋</span>}</div>;
            })}</div>
            {props.pendingPokemon && <button id={`trainer-add-to-${team.id}`} className="trainer-panel__primary" type="button" disabled={panel.busy || team.pokemon.length >= team.capacity || team.pokemon.some((entry) => entry.id === props.pendingPokemon?.id)} onClick={() => void panel.addToTeam(team.id)}>＋ {team.pokemon.some((entry) => entry.id === props.pendingPokemon?.id) ? `Already On This Team` : team.pokemon.length >= team.capacity ? `Team Full` : `Add ${props.pendingPokemon.name}`}</button>}
          </section>)}
        </div> : (teamsView || profileView) && !panel.user && !panel.loading ? <div className="trainer-panel__empty"><strong>Sign in to view this.</strong><p>Your Trainer Passport and teams are waiting.</p><button id="trainer-private-signin" className="trainer-panel__primary" onClick={() => panel.changeView(`signin`)}>→ Sign In</button><button id="trainer-private-signup" className="trainer-panel__text-button" onClick={() => panel.changeView(`signup`)}>＋ Become A Trainer</button></div> : <form id="trainer-account-form" className="trainer-panel__account-form" onSubmit={(event) => { event.preventDefault(); void panel.submitAccount(); }}>
          {showName && <label htmlFor="trainer-display-name">Trainer Name<input id="trainer-display-name" value={panel.name} autoComplete="nickname" placeholder="Your trainer name" minLength={2} maxLength={32} required onChange={(event) => panel.setName(event.target.value)} /></label>}
          <label htmlFor="trainer-email">Email<input id="trainer-email" type="email" value={panel.email} autoComplete="email" placeholder="trainer@example.com" maxLength={254} required disabled={profileView} onChange={(event) => panel.setEmail(event.target.value)} /></label>
          {!profileView && <label htmlFor="trainer-password">Password<input id="trainer-password" type="password" value={panel.password} autoComplete={panel.view === `signup` ? `new-password` : `current-password`} placeholder={panel.view === `signup` ? `At least 8 characters` : `Your password`} minLength={panel.view === `signup` ? 8 : undefined} maxLength={128} required onChange={(event) => panel.setPassword(event.target.value)} /></label>}
          {showTrainerPicker && <fieldset id="trainer-character-picker" className="trainer-panel__characters"><legend>Choose Your Trainer <span>Generations I–IV</span></legend><div className="trainer-panel__character-grid">{trainerModels.map((trainer) => <label id={`trainer-character-${trainer.id}`} className={`trainer-panel__character ${panel.trainerId === trainer.id ? `is-selected` : ``}`} key={trainer.id}>
            <input id={`trainer-character-input-${trainer.id}`} type="radio" name="trainer-model" value={trainer.id} checked={panel.trainerId === trainer.id} onChange={() => panel.setTrainerId(trainer.id)} /><img src={trainer.image} alt={`${trainer.name} from ${trainer.game}`} loading="lazy" /><strong>{trainer.name}</strong><small>GEN {trainer.generation}</small><span className="trainer-panel__character-check">✓</span>
          </label>)}</div><p>Original FireRed, LeafGreen, HeartGold, SoulSilver, Emerald, and Platinum game sprites.</p></fieldset>}
          <button id="trainer-account-submit" className="trainer-panel__primary" type="submit" disabled={panel.busy}>{panel.busy ? `Saving…` : profileView ? `✓ Save Trainer Profile` : panel.view === `signup` ? `＋ Become A Trainer` : `→ Sign In`}</button>
          {!profileView && <p className="trainer-panel__switch">{panel.view === `signup` ? `Already a Trainer?` : `New to the adventure?`} <button id="trainer-auth-switch" className="trainer-panel__text-button" type="button" onClick={() => panel.changeView(panel.view === `signup` ? `signin` : `signup`)}>{panel.view === `signup` ? `Sign In` : `Become A Trainer`}</button></p>}
        </form>}
        <footer id="trainer-panel-footer" className="trainer-panel__footer"><p>⌁ Device demo · Trainer accounts, teams, and votes stay on this device. Profiles start private.</p>{panel.user && <button id="trainer-signout" className="trainer-panel__text-button" type="button" disabled={panel.busy} onClick={() => void panel.signOut()}>↪ Sign Out</button>}</footer>
      </div>
    </div>
  );
};

export default TrainerPanel;
export type { TrainerPanelProps, TrainerPanelView } from './types';
