import Head from 'expo-router/head';
import { Link } from 'expo-router';
import { ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, Code2, GitBranch, Search, ScanLine, Sparkles, UsersRound, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTrainer } from '../../shared/teams/useTrainer';
import type { TeamPokemon } from '../../shared/models';
import { pokemonTypes, type PokemonCard as Pokemon, type PokemonGeneration, type PokemonType } from '../../shared/pokemon/types';
import PageLoader from '../PageLoader/index.web';
import PokemonCard, { PokemonSkeleton } from '../PokemonCard/index.web';
import PokemonDetails from '../PokemonDetails/index.web';
import TrainerPanel from '../TrainerPanel';
import type { TrainerPanelView } from '../TrainerPanel/types';
import { regions, useLanding } from './useLanding';
import './styles.scss';

export interface LandingProps { catalogOnly?: boolean; initialGeneration?: PokemonGeneration; }

const SplitLine = ({ text, offset = 0 }: { text: string; offset?: number }) => <span className='split-line'>{text.split(' ').map((word, index) => <span className='split-word-wrap' key={`${word}-${index}`}><span className='split-word' style={{ '--delay': `${(index + offset) * .065}s` } as CSSProperties}>{word}&nbsp;</span></span>)}</span>;

export default function Landing({ catalogOnly = false, initialGeneration }: LandingProps) {
  const dex = useLanding(initialGeneration);
  const { user, loading: authLoading } = useAuth();
  const { votes, voteTotals, toggleVote } = useTrainer();
  const browse = useRef<HTMLElement>(null);
  const [heroShiny, setHeroShiny] = useState(false);
  const [heroReady, setHeroReady] = useState(catalogOnly);
  const [selected, setSelected] = useState<number | null>(null);
  const [panel, setPanel] = useState<TrainerPanelView | null>(null);
  const [pendingPokemon, setPendingPokemon] = useState<TeamPokemon | null>(null);
  const [pendingVote, setPendingVote] = useState<{ id: number; direction: 1 | -1 } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { elements.forEach(element => element.classList.add('is-revealed')); return; }
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); } }); }, { threshold: .08 });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [dex.pokemon]);

  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 4000); return () => clearTimeout(timer); }, [notice]);

  const scrollToEntries = () => browse.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  const onVote = async (id: number, direction: 1 | -1) => {
    if (authLoading) return;
    if (!user) { setPendingVote({ id, direction }); setPanel('signup'); return; }
    try { await toggleVote(id, direction); } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable To Save Vote'); }
  };
  const onAdd = (pokemon: Pokemon, shiny: boolean) => {
    if (authLoading) return;
    setPendingPokemon({ id: pokemon.id, name: pokemon.displayName, image: (shiny ? pokemon.artwork.shiny ?? pokemon.artwork.shinySprite : pokemon.artwork.default ?? pokemon.artwork.sprite) ?? '/media/pokeball.png', types: pokemon.types });
    setPanel(user ? 'teams' : 'signup');
  };
  const onAuthenticated = async () => {
    if (pendingVote) { try { await toggleVote(pendingVote.id, pendingVote.direction); } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable To Save Vote'); } setPendingVote(null); setPanel(null); }
    else if (pendingPokemon) setPanel('teams');
    else setPanel(null);
  };

  return (
    <div className={`landing-page ${catalogOnly ? 'is-catalog' : ''}`} id='landing-page'>
      <Head><title>{catalogOnly ? 'Explore the Pokédex' : 'Your next adventure starts here'} · Pokedex Database</title></Head>
      {!catalogOnly && <PageLoader ready={!dex.loading} onComplete={() => setHeroReady(true)} />}
      {!catalogOnly && <>
        <section className={`hero-section page-width ${heroReady ? 'is-ready' : ''}`} id='hero-section'>
          <div className='hero-copy'>
            <div className='eyebrow hero-eyebrow'><span className='status-dot' /> YOUR ADVENTURE STARTS HERE</div>
            <h1 aria-label='A world of Pokémon. A journey of your own.'><SplitLine text='A world of' /><SplitLine text='Pokémon.' offset={3} /><span className='hero-heading-secondary'><SplitLine text='A journey of' offset={4} /><SplitLine text='your own.' offset={7} /></span></h1>
            <p className='hero-description'>Every Pokémon has a story. Discover yours.<br />Explore the original four regions, get to know your<br className='desktop-break' /> partners, and put together a team that’s all you.</p>
            <div className='hero-actions'><button className='button button-dark' id='explore-pokedex-button' onClick={scrollToEntries}><ScanLine size={17} />Explore the Pokédex<ArrowRight size={17} /></button><Link className='hero-secondary-link' href='/signup'>Become a trainer<ArrowRight size={15} /></Link></div>
            <div className='hero-stats'><div><strong>493</strong><span>POKÉMON TO DISCOVER</span></div><i /><div><strong>4</strong><span>ICONIC REGIONS</span></div><i /><div className='hero-stats-last'><img src='/media/pokeball.png' alt='' /><span>ONE GREAT<br />ADVENTURE</span></div></div>
          </div>
          <div className='hero-instrument' id='hero-instrument'>
            <div className='hero-instrument-top'><span className='mono-label'><span className='status-dot' /> FEATURED DISCOVERY</span><span className='mono-label hero-coordinates'>KANTO / 006</span></div>
            <div className='hero-art-stage'>
              <div className='hero-orbit hero-orbit-outer' /><div className='hero-orbit hero-orbit-inner' />
              <span className='hero-plus hero-plus-one'>+</span><span className='hero-plus hero-plus-two'>+</span><span className='hero-plus hero-plus-three'>+</span>
              <span className='hero-art-number'>006</span>
              <button className='hero-art-button' id='hero-charizard' aria-label={`Open ${heroShiny ? 'shiny ' : ''}Charizard entry`} onClick={() => setSelected(6)}><img src={`/media/pokemon/6${heroShiny ? '-shiny' : ''}.png`} alt={`${heroShiny ? 'Shiny ' : ''}Charizard with wings spread`} fetchPriority='high' /></button>
              <div className='hero-entry-tag'><span>Nº 006</span><strong>Charizard</strong><span>THE FLAME POKÉMON</span></div>
              <div className='hero-type-tags'><span className='type-tag type-fire'>Fire</span><span className='type-tag type-flying'>Flying</span></div>
              <button className={`hero-shiny-switch ${heroShiny ? 'is-shiny' : ''}`} id='hero-shiny-switch' aria-pressed={heroShiny} onClick={() => setHeroShiny(!heroShiny)}><Sparkles size={14} />{heroShiny ? 'Shiny form' : 'Try shiny form'}<span className='mini-switch'><i /></span></button>
            </div>
            <div className='hero-instrument-bottom'><span><span className='status-dot' /> FIELD GUIDE / GEN I</span><button onClick={() => setSelected(6)}>View entry<ArrowRight size={14} /></button></div>
          </div>
          <div className='hero-bottom-note'><span>BUILT FOR TRAINERS. FUELED BY CURIOSITY.</span><button onClick={scrollToEntries} aria-label='Scroll to Pokémon entries'><ArrowDown size={15} /></button></div>
        </section>
        <div className='world-strip' id='world-strip'><div className='world-strip-inner page-width'><span>FOUR REGIONS.<br /><strong>A WORLD OF POSSIBILITIES.</strong></span><div>{regions.map(region => <Link href={{ pathname: '/pokedex', params: { generation: region.generation } }} key={region.generation} id={`region-quick-link-${region.generation}`}><span>0{region.generation}</span>{region.name}<ArrowRight size={12} /></Link>)}</div><span className='world-strip-range'>001 — 493 <ScanLine size={20} /></span></div></div>
      </>}

      <section className='browse-section page-width' ref={browse} id='browse-section' aria-labelledby='browse-heading'>
        <div className='section-heading reveal'><div><div className='eyebrow'><span className='status-dot' /> THE POKÉDEX</div><h2 id='browse-heading'>{catalogOnly ? 'Every partner. Every possibility.' : 'Meet your next partner.'}</h2><p>Old favorites. New discoveries. There’s a Pokémon for everyone.</p></div>{!catalogOnly && <Link href='/pokedex' className='text-link browse-all-link'>View full Pokédex<ArrowRight size={16} /></Link>}</div>
        <div className='dex-controls reveal' id='dex-controls'>
          <div className='dex-search-wrap'><Search size={18} /><label className='sr-only' htmlFor='dex-search'>Search Pokémon by name or Pokédex number</label><input id='dex-search' className='dex-search' value={dex.q} onChange={event => dex.setQuery(event.target.value)} placeholder='Search by name or Pokédex number…' autoComplete='off' spellCheck={false} />{dex.q && <button className='search-clear' aria-label='Clear search' onClick={() => dex.setQuery('')}><X size={15} /></button>}<span className='search-shortcut'># 001</span></div>
          <div className='dex-type-select'><span>TYPE</span><select id='dex-type-filter' aria-label='Filter Pokémon by type' value={dex.type} onChange={event => dex.chooseType(event.target.value as PokemonType | 'all')}><option value='all'>All types</option>{[...pokemonTypes].sort().map(type => <option value={type} key={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select><ChevronDown size={13} /></div>
          <button className={`dex-shiny-mode ${dex.shiny ? 'is-active' : ''}`} id='dex-shiny-mode' aria-pressed={dex.shiny} onClick={() => dex.setShiny(!dex.shiny)}><Sparkles size={14} /><span>Shiny mode</span><span className='mini-switch'><i /></span></button>
        </div>
        <div className='dex-filter-row reveal'><div className='dex-generation-filters' role='group' aria-label='Filter by generation'><button id='generation-filter-all' className={dex.generation === 'all' ? 'is-active' : ''} onClick={() => dex.chooseGeneration('all')}>All regions</button>{regions.map(region => <button key={region.generation} id={`generation-filter-${region.generation}`} className={dex.generation === region.generation ? 'is-active' : ''} onClick={() => dex.chooseGeneration(region.generation)}>{region.name}<span>GEN {['I', 'II', 'III', 'IV'][region.generation - 1]}</span></button>)}</div><span className='dex-result-label' aria-live='polite'>{dex.loading ? 'Reading entries…' : `${dex.pagination?.total ?? 0} Pokémon found`}</span></div>
        <div className='pokemon-grid' id='pokemon-grid' aria-busy={dex.loading}>
          {dex.loading ? Array.from({ length: 8 }, (_, index) => <PokemonSkeleton index={index} key={index} />) : dex.error ? <div className='dex-empty-state' role='alert'><ScanLine size={30} /><h3>A little interference.</h3><p>{dex.error}</p><button className='button button-dark' onClick={dex.retry}>Try again<ArrowRight size={16} /></button></div> : dex.pokemon.length === 0 ? <div className='dex-empty-state'><Search size={30} /><h3>No sightings here. Yet.</h3><p>Try a different name, number, type or region.</p><button className='button button-dark' onClick={dex.resetFilters}>Reset filters<ArrowRight size={16} /></button></div> : dex.pokemon.map(pokemon => <PokemonCard key={pokemon.id} pokemon={pokemon} shinyMode={dex.shiny} disabled={authLoading} onOpen={setSelected} onVote={onVote} onAdd={onAdd} vote={votes[pokemon.id]} voteTotal={voteTotals[pokemon.id]} />)}
        </div>
        <div className='dex-pagination'><span>{!dex.loading && !dex.error && dex.pagination?.total ? `Showing ${dex.offset + 1}–${dex.offset + dex.pokemon.length} of ${dex.pagination.total} entries` : 'Entries powered by PokéAPI'}</span><div><button className='pagination-button' id='previous-pokemon-page' disabled={dex.loading || dex.pagination?.previous == null} onClick={() => { if (dex.pagination?.previous != null) { dex.setOffset(dex.pagination.previous); scrollToEntries(); } }} aria-label='Previous Pokémon entries'><ArrowLeft size={16} /></button><button className='pagination-button' id='next-pokemon-page' disabled={dex.loading || dex.pagination?.next == null} onClick={() => { if (dex.pagination?.next != null) { dex.setOffset(dex.pagination.next); scrollToEntries(); } }}>More to discover<ArrowRight size={15} /></button></div></div>
        <p className='device-vote-note'>Votes and teams are saved on this device. Become a trainer to make them yours.</p>
      </section>

      {!catalogOnly && <>
        <section className='features-section page-width reveal' id='features-section' aria-labelledby='features-heading'><div className='section-heading'><div><div className='eyebrow'>MORE THAN A DATABASE</div><h2 id='features-heading'>Your adventure. Better equipped.</h2></div><p>Everything a curious trainer needs.<br />Right in your pocket.</p></div><div className='feature-grid'><div className='feature-item'><span className='feature-icon'><ScanLine size={23} /></span><span className='feature-number'>01 / DISCOVER</span><h3>Get to know<br />every Pokémon.</h3><p>Types, stats, shiny forms, and entries from the games. A closer look at every partner.</p><button className='text-link' onClick={() => setSelected(25)}>Take a closer look<ArrowRight size={15} /></button></div><div className='feature-item'><span className='feature-icon'><GitBranch size={23} /></span><span className='feature-number'>02 / GROW</span><h3>Know the<br />next step.</h3><p>A new level. A special stone. A little friendship. Find out what’s needed for the next evolution.</p><button className='text-link' onClick={() => setSelected(4)}>Explore evolutions<ArrowRight size={15} /></button></div><div className='feature-item'><span className='feature-icon'><UsersRound size={23} /></span><span className='feature-number'>03 / TEAM UP</span><h3>Your partners.<br />Your play style.</h3><p>Choose your trainer, build teams of 3, 6 or 10, and keep your favorites close at hand.</p><button className='text-link' onClick={() => setPanel(user ? 'teams' : 'signup')}>Build your first team<ArrowRight size={15} /></button></div></div></section>
        <section className='regions-section page-width reveal' id='regions-section' aria-labelledby='regions-heading'><div className='section-heading'><div><div className='eyebrow'>A LITTLE NOSTALGIA. A LOT TO EXPLORE.</div><h2 id='regions-heading'>Four regions. Countless memories.</h2></div><Link href='/regions' className='text-link'>Explore the regions<ArrowRight size={15} /></Link></div><div className='region-grid'>{regions.map(region => <Link className={`region-card region-${region.color}`} href={{ pathname: '/pokedex', params: { generation: region.generation } }} key={region.generation} id={`region-card-${region.generation}`}><div className='region-card-top'><span>GEN {['I', 'II', 'III', 'IV'][region.generation - 1]}</span><ArrowRight size={15} /></div><div className='region-art-circle' /><img className='region-starter' src={`/media/pokemon/${region.starter}.png`} alt={`${region.name} starter Pokémon`} loading='lazy' /><div className='region-card-bottom'><h3>{region.name}</h3><span>{region.count} POKÉMON <i /> {region.range}</span></div></Link>)}</div></section>
        <section className='developer-section page-width reveal' id='developer-section'><div className='developer-copy'><span className='developer-eyebrow'><Code2 size={14} /> FOR THE BUILDERS & DREAMERS</span><h2>A world of data.<br />Ready for your next idea.</h2><p>Pokémon, shiny artwork, stats and evolution methods.<br />One clear, versioned API. Endless ways to create.</p><Link href='/developers' className='button developer-button'>Explore the API<ArrowRight size={16} /></Link></div><div className='developer-terminal'><div className='terminal-top'><span /><span /><span /><span className='terminal-label'>POKEDEX DATABASE / API v1</span></div><div className='terminal-request'><span>GET</span> /api/v1/pokemon/6</div><pre><code>{`{\n  "success": true,\n  "data": {\n    "id": 6,\n    "name": "charizard",\n    "types": ["fire", "flying"],\n    ...\n  }\n}`}</code></pre><div className='terminal-bottom'><Check size={12} /><span>Structured JSON · OpenAPI 3.1</span><Code2 size={13} /></div></div></section>
        <section className='trainer-cta page-width reveal' id='trainer-cta'><img src='/media/pokeball.png' alt='' /><div><h2>A new adventure is calling.</h2><p>Pick your trainer. Find your partners. Make it yours.</p></div><button className='button button-red' onClick={() => setPanel(user ? 'teams' : 'signup')}>{user ? 'Open your teams' : 'Become a trainer'}<ArrowRight size={17} /></button></section>
      </>}
      {selected !== null && <PokemonDetails id={selected} onClose={() => setSelected(null)} onSelect={setSelected} />}
      <TrainerPanel view={panel} pendingPokemon={pendingPokemon} onViewChange={setPanel} onAuthenticated={onAuthenticated} onClose={() => { setPanel(null); setPendingPokemon(null); setPendingVote(null); }} />
      {notice && <div className='landing-toast' role='status'>{notice}<button onClick={() => setNotice(null)} aria-label='Dismiss message'><X size={14} /></button></div>}
    </div>
  );
}
