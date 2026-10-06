import Head from 'expo-router/head';
import { Link } from 'expo-router';
import { ArrowLeft, ArrowRight, Code2, Download, Play, Terminal } from 'lucide-react';
import { useState } from 'react';
import { pokemonAPI } from '../../api/pokemon';
import { regions } from '../Landing/useLanding';
import { pageContent, type InfoPageName } from './content';
import './styles.scss';

const endpoints = [
  { path: '/api/health', purpose: 'Runtime health', query: 'Process and cache status' },
  { path: '/api/v1/pokemon', purpose: 'Discover Pokémon', query: 'q · generation · type · shiny · limit · offset' },
  { path: '/api/v1/pokemon/{id}', purpose: 'Full Pokédex entry', query: 'A number or species name, such as 6 or charizard' },
  { path: '/api/v1/pokemon/{id}/evolutions', purpose: 'Evolution guide', query: 'Branches, methods, conditions and original fields' },
];

export default function InfoPage({ page }: { page: InfoPageName }) {
  const content = pageContent[page];
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tryRequest = async () => {
    setLoading(true);
    try { const result = await pokemonAPI.detail(6); setResponse(JSON.stringify(result, null, 2)); }
    catch (error) { setResponse(error instanceof Error ? error.message : 'Request failed'); }
    finally { setLoading(false); }
  };

  return <article className={`info-page info-page-${page} page-width`} id={`info-page-${page}`}>
    <Head><title>{page === 'developers' ? 'Developer API' : page[0].toUpperCase() + page.slice(1)} · Pokedex Database</title></Head>
    <Link href='/' className='text-link info-back'><ArrowLeft size={14} />Back to discovery</Link>
    <div className='info-hero'><div className='eyebrow'><span className='status-dot' />{content.eyebrow}</div><h1>{content.title}</h1><p>{content.intro}</p></div>
    {page === 'regions' && <div className='info-region-grid'>{regions.map(region => <Link href={{ pathname: '/pokedex', params: { generation: region.generation } }} className={`info-region-card info-region-${region.color}`} id={`info-region-${region.generation}`} key={region.generation}><div><span className='eyebrow'>GEN {['I', 'II', 'III', 'IV'][region.generation - 1]} / {region.range}</span><h2>{region.name}</h2><p>{region.subtitle}</p><span className='info-region-games'>{region.games}</span><span className='text-link'>{region.count} Pokémon to discover<ArrowRight size={16} /></span></div><img src={`/media/pokemon/${region.starter}.png`} alt={`${region.name} starter Pokémon`} /></Link>)}</div>}
    {page === 'developers' && <>
      <div className='api-doc-actions'><a href='/openapi.json' download='pokedex-database-openapi.json' className='button button-dark'><Download size={16} />Download OpenAPI</a><a href='/api' className='button button-light'><Code2 size={16} />API directory<ArrowRight size={14} /></a><a href='https://pokeapi.co/docs/v2' target='_blank' rel='noreferrer' className='text-link'>Data source<ArrowRight size={14} /></a></div>
      <div className='api-endpoints' id='api-endpoints'><div className='api-doc-section-title'><Terminal size={18} /><h2>Endpoints</h2><span>v1 / GET</span></div>{endpoints.map((endpoint, index) => <div className='api-endpoint-row' id={`api-endpoint-${index}`} key={endpoint.path}><span className='api-method'>GET</span><div><code>{endpoint.path}</code><span>{endpoint.purpose}</span></div><p>{endpoint.query}</p></div>)}</div>
      <div className='api-playground' id='api-playground'><div className='api-doc-section-title'><Code2 size={18} /><h2>Meet the response</h2><button className='button button-dark' id='api-try-request' disabled={loading} onClick={tryRequest}><Play size={13} />{loading ? 'Requesting…' : 'Try Charizard'}</button></div><div className='api-playground-url'><span>GET</span><code>/api/v1/pokemon/6</code></div><pre tabIndex={0} aria-label='API response' aria-live='polite'><code>{response || '// Select “Try Charizard” to make a real request to the internal API.'}</code></pre></div>
    </>}
    <div className='info-blocks'>{content.blocks.map((block, index) => <section className='info-block' id={`info-block-${page}-${index}`} key={block.title}><span className='info-block-number'>0{index + 1}</span><div><h2>{block.title}</h2><p>{block.text}</p></div></section>)}</div>
    {content.action && (content.action.href.startsWith('mailto:') ? <a className='button button-dark info-action' href={content.action.href}>{content.action.label}<ArrowRight size={16} /></a> : <Link className='button button-dark info-action' href={content.action.href as '/pokedex' | '/contact'}>{content.action.label}<ArrowRight size={16} /></Link>)}
  </article>;
}
