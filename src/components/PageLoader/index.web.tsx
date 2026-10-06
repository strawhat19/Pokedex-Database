import { useEffect, useRef, useState } from 'react';
import './styles.scss';

let hasOpened = false;

export default function PageLoader({ ready, onComplete }: { ready: boolean; onComplete?: () => void }) {
  const [visible, setVisible] = useState(!hasOpened);
  const [opening, setOpening] = useState(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;

  useEffect(() => { if (!visible) complete.current?.(); }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = before; };
  }, [visible]);

  useEffect(() => {
    if (!ready || !visible) return;
    let alive = true;
    let finish: ReturnType<typeof setTimeout>;
    const timer = setTimeout(async () => {
      await Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise(resolve => setTimeout(resolve, 800))]);
      if (!alive) return;
      hasOpened = true;
      setOpening(true);
      finish = setTimeout(() => { if (alive) setVisible(false); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 900);
    }, 250);
    return () => { alive = false; clearTimeout(timer); clearTimeout(finish); };
  }, [ready, visible]);

  useEffect(() => {
    if (!visible) return;
    // Leave the instrument panel available if the upstream request is slow.
    let finish: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => { hasOpened = true; setOpening(true); finish = setTimeout(() => setVisible(false), 900); }, 12000);
    return () => { clearTimeout(timer); clearTimeout(finish); };
  }, [visible]);

  if (!visible) return null;
  return <div className={`page-loader ${opening ? 'is-opening' : ''}`} id='page-loader' role='status' aria-live='polite' aria-label='Opening your Pokédex'>
    <div className='loader-half loader-top'><span className='loader-top-label'>POKEDEX DATABASE</span></div>
    <div className='loader-half loader-bottom'><span className='loader-bottom-label'>A WORLD OF DISCOVERY IS OPENING UP.</span></div>
    <div className='loader-lens'><div className='loader-lens-inner'><span /></div></div>
    <span className='loader-message'>{opening ? 'Ready for adventure.' : 'Connecting your Pokédex…'}</span>
  </div>;
}
