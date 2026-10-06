import { ArrowRight, ChevronRight, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { pokemonAPI } from '../../api/pokemon';
import type { PokemonDetail } from '../../shared/pokemon/types';
import './styles.scss';

interface Props { id: number; onClose: () => void; onSelect: (id: number) => void; }

const statLabels: Record<string, string> = { hp: 'HP', attack: 'Attack', defense: 'Defense', speed: 'Speed', 'special-attack': 'Sp. attack', 'special-defense': 'Sp. defense' };

export default function PokemonDetails({ id, onClose, onSelect }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<PokemonDetail | null>(null);
  const [shiny, setShiny] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const artwork = data ? (shiny ? data.artwork.shiny ?? data.artwork.shinySprite : data.artwork.default ?? data.artwork.sprite) : null;

  useEffect(() => setImageFailed(false), [artwork]);

  useEffect(() => {
    dialog.current?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = before; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null); setShiny(false);
    pokemonAPI.detail(id, controller.signal)
      .then(result => { if (controller.signal.aborted) return; if (!result.success) throw new Error(result.error.message); setData(result.data); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load this entry'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);

  return <dialog className='pokemon-detail-dialog' id={`pokemon-detail-${id}`} ref={dialog} aria-labelledby='detail-name' onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className='detail-panel'>
      <div className='detail-topline'><span className='eyebrow'>FIELD RECORD / Nº {String(id).padStart(3, '0')}</span><button className='icon-button' aria-label='Close Pokémon entry' onClick={onClose}><X size={18} /></button></div>
      {loading ? <div className='detail-loading' role='status'><div className='skeleton-shimmer' /><h2 id='detail-name'>Reading field notes…</h2></div> : error ? <div className='detail-error'><h2 id='detail-name'>A little interference.</h2><p>{error}</p><button className='button button-dark' onClick={() => setRevision(revision + 1)}>Try again<ArrowRight size={16} /></button></div> : data && <>
        <div className='detail-summary'>
          <div className={`detail-art pokemon-type-${data.types[0]}`}>
            <button className='detail-shiny-button' aria-pressed={shiny} onClick={() => setShiny(!shiny)} disabled={!data.artwork.shiny && !data.artwork.shinySprite}><Sparkles size={15} />{shiny ? 'Shiny form' : 'Normal form'}</button>
            {artwork && !imageFailed ? <img src={artwork} alt={`${shiny ? 'Shiny ' : ''}${data.displayName}`} onError={() => setImageFailed(true)} /> : <span className='detail-empty'>Artwork unavailable</span>}
          </div>
          <div className='detail-title'><span className='mono-label'>{data.category} · GEN {['I', 'II', 'III', 'IV'][data.generation - 1]}</span><h2 id='detail-name'>{data.displayName}</h2><div className='pokemon-type-tags'>{data.types.map(type => <span className={`type-tag type-${type}`} key={type}>{type}</span>)}</div><p>{data.description}</p><div className='detail-measures'><div><span>HEIGHT</span><strong>{data.heightMeters} m</strong></div><div><span>WEIGHT</span><strong>{data.weightKg} kg</strong></div><div><span>HABITAT</span><strong>{data.habitat?.replaceAll('-', ' ') || 'Unknown'}</strong></div></div></div>
        </div>
        <section className='detail-section' id={`base-stats-${id}`}><div className='detail-section-heading'><h3>Base stats</h3><span>Species data</span></div><div className='detail-stat-grid'>{data.stats.map(stat => <div key={stat.name} className='detail-stat'><span>{statLabels[stat.name] || stat.name}</span><div><i style={{ width: `${Math.min(100, stat.value / 255 * 100)}%` }} /></div><strong>{stat.value}</strong></div>)}</div><div className='detail-abilities'><span>ABILITIES</span>{data.abilities.map(ability => <span key={ability.name}>{ability.name.replaceAll('-', ' ')}{ability.isHidden ? ' (hidden)' : ''}</span>)}</div></section>
        <section className='detail-section' id={`evolution-chain-${id}`}><div className='detail-section-heading'><h3>The next chapter</h3><span>Evolution guide</span></div>{data.evolutions.edges.length ? <div className='evolution-steps'>{data.evolutions.edges.map((edge, index) => { const from = data.evolutions.nodes.find(node => node.id === edge.from); const to = data.evolutions.nodes.find(node => node.id === edge.to); return <div className='evolution-step' key={`${edge.from}-${edge.to}`} id={`evolution-step-${id}-${index}`}><div className='evolution-species'><button onClick={() => onSelect(edge.from)}>{from?.displayName ?? `#${edge.from}`}</button><ChevronRight size={14} /><button onClick={() => onSelect(edge.to)}>{to?.displayName ?? `#${edge.to}`}</button></div><div className='evolution-methods'>{edge.methods.map((method, methodIndex) => <div key={methodIndex}><strong>{method.method}</strong>{method.conditions.length > 0 && <p>{method.conditions.join(' · ')}</p>}</div>)}</div></div>; })}</div> : <p className='detail-empty'>This Pokémon has no further evolution in generations I–IV.</p>}<p className='detail-source-note'>{data.evolutions.note}</p></section>
        <section className='detail-section'><div className='detail-section-heading'><h3>Notes from the games</h3><span>{data.descriptions.length} entries</span></div><div className='game-notes'>{data.descriptions.map((description, index) => <div key={`${description.version}-${index}`}><span>{description.version.replaceAll('-', ' ')}</span><p>{description.text}</p></div>)}</div></section>
        <p className='detail-source-note'>PokéAPI species data is current; stats and types may reflect updates after generation IV. Evolution methods can vary by game.</p>
      </>}
    </div>
  </dialog>;
}
