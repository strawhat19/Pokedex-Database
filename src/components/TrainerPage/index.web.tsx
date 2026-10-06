import Head from 'expo-router/head';
import { Link, useRouter } from 'expo-router';
import { ArrowLeft, UsersRound } from 'lucide-react';
import TrainerPanel from '../TrainerPanel';
import type { TrainerPanelView } from '../TrainerPanel/types';
import './styles.scss';

const paths = { teams: '/teams', profile: '/profile', signin: '/signin', signup: '/signup' } as const;

export default function TrainerPage({ view }: { view: TrainerPanelView }) {
  const router = useRouter();
  return <section className='trainer-access-page page-width' id={`trainer-access-${view}`}>
    <Head><title>{view === 'teams' ? 'Your teams' : view === 'profile' ? 'Trainer profile' : view === 'signin' ? 'Sign in' : 'Become a trainer'} · Pokedex Database</title></Head>
    <Link href='/' className='text-link'><ArrowLeft size={15} />Back to discovery</Link>
    <div className='trainer-access-intro'><UsersRound size={35} /><span className='eyebrow'>YOUR ADVENTURE, ON THIS DEVICE</span><h1>Your Trainer Passport.</h1><p>Your partners, your teams, your next chapter.</p></div>
    <TrainerPanel view={view} onViewChange={next => router.replace(paths[next])} onClose={() => router.replace('/')} />
  </section>;
}
