import { ArrowDown, ArrowUp, ChevronRight, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PokemonCard as Pokemon } from '../../shared/pokemon/types';
import './styles.scss';

export interface PokemonCardProps {
  pokemon: Pokemon;
  shinyMode: boolean;
  disabled?: boolean;
  vote?: number;
  voteTotal?: number;
  onOpen: (id: number) => void;
  onAdd: (pokemon: Pokemon, shiny: boolean) => void;
  onVote: (id: number, direction: 1 | -1) => void;
}

export default function PokemonCard({ pokemon, shinyMode, disabled = false, vote = 0, voteTotal = 0, onAdd, onOpen, onVote }: PokemonCardProps) {
  const [shiny, setShiny] = useState(shinyMode);
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const description = pokemon.descriptions[descriptionIndex];
  const artwork = shiny ? pokemon.artwork.shiny || pokemon.artwork.shinySprite : pokemon.artwork.default || pokemon.artwork.sprite;

  useEffect(() => setShiny(shinyMode), [shinyMode]);
  useEffect(() => setImageFailed(false), [artwork]);

  return (
    <article className={`pokemon-card pokemon-type-${pokemon.types[0]} ${shiny ? 'is-shiny' : ''}`} id={`pokemon-card-${pokemon.id}`}>
      <div className='pokemon-art-screen'>
        <div className='pokemon-screen-header'>
          <span className='entry-number'>Nº {String(pokemon.id).padStart(3, '0')}</span>
          <button className={`pokemon-shiny-toggle ${shiny ? 'is-active' : ''}`} id={`shiny-toggle-${pokemon.id}`} onClick={() => setShiny(!shiny)} aria-label={`Show ${shiny ? 'normal' : 'shiny'} ${pokemon.displayName}`} aria-pressed={shiny} disabled={!pokemon.artwork.shiny && !pokemon.artwork.shinySprite}><Sparkles size={13} /><span>{shiny ? 'Shiny' : 'Normal'}</span></button>
        </div>
        <span className='pokemon-watermark' aria-hidden='true'>{String(pokemon.id).padStart(3, '0')}</span>
        <button className='pokemon-art-button' id={`pokemon-art-${pokemon.id}`} onClick={() => onOpen(pokemon.id)} aria-label={`Open ${pokemon.displayName} Pokédex entry`}>
          {artwork && !imageFailed ? <img src={artwork} alt={`${shiny ? 'Shiny ' : ''}${pokemon.displayName}`} loading='lazy' onError={() => setImageFailed(true)} /> : <div className='art-unavailable'><img src='/media/pokeball.png' alt='' /><span>Artwork unavailable</span></div>}
        </button>
        <div className='pokemon-size-line'><span>{pokemon.heightMeters} m</span><span className='screen-crosshair'>+</span><span>{pokemon.weightKg} kg</span></div>
      </div>
      <div className='pokemon-card-body'>
        <div className='pokemon-category'>{pokemon.category || 'Pokémon'} <span>GEN {['I', 'II', 'III', 'IV'][pokemon.generation - 1]}</span></div>
        <button className='pokemon-name-button' id={`pokemon-name-${pokemon.id}`} onClick={() => onOpen(pokemon.id)}><h3>{pokemon.displayName}</h3><ChevronRight size={17} /></button>
        <div className='pokemon-type-tags'>{pokemon.types.map(type => <span key={type} className={`type-tag type-${type}`}>{type}</span>)}</div>
        <p className='pokemon-description'>{description?.text || pokemon.description || 'No English field notes are available for this entry.'}</p>
        <div className='pokemon-description-source'><span>{description?.version?.replaceAll('-', ' ') || 'Field notes'}</span><button id={`alt-description-${pokemon.id}`} disabled={pokemon.descriptions.length < 2} onClick={() => setDescriptionIndex((descriptionIndex + 1) % pokemon.descriptions.length)} aria-label={`Read another game description for ${pokemon.displayName}`}><RefreshCw size={11} /><span>Alt. entry</span></button></div>
      </div>
      <div className='pokemon-card-actions'>
        <div className='pokemon-votes' aria-label='Votes on this device'>
          <button id={`upvote-${pokemon.id}`} disabled={disabled} className={vote === 1 ? 'is-selected' : ''} onClick={() => onVote(pokemon.id, 1)} aria-label={`Upvote ${pokemon.displayName}`} aria-pressed={vote === 1}><ArrowUp size={16} /></button>
          <span aria-live='polite'>{voteTotal}</span>
          <button id={`downvote-${pokemon.id}`} disabled={disabled} className={vote === -1 ? 'is-selected' : ''} onClick={() => onVote(pokemon.id, -1)} aria-label={`Downvote ${pokemon.displayName}`} aria-pressed={vote === -1}><ArrowDown size={16} /></button>
        </div>
        <button className='add-to-team-button' id={`add-to-team-${pokemon.id}`} disabled={disabled} onClick={() => onAdd(pokemon, shiny)}><Plus size={14} /><span>Add to team</span></button>
      </div>
    </article>
  );
}

export function PokemonSkeleton({ index }: { index: number }) {
  return <div className='pokemon-card pokemon-skeleton' id={`pokemon-skeleton-${index}`} aria-hidden='true'><div className='skeleton-art skeleton-shimmer' /><div className='skeleton-content'><div className='skeleton-line skeleton-shimmer' /><div className='skeleton-line skeleton-wide skeleton-shimmer' /><div className='skeleton-line skeleton-small skeleton-shimmer' /><div className='skeleton-line skeleton-shimmer' /></div><div className='skeleton-actions skeleton-shimmer' /></div>;
}
