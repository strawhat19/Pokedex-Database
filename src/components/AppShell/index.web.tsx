import { Link, usePathname, useRouter } from 'expo-router';
import { ArrowRight, ArrowUp, Code2, Compass, Menu, Moon, ScanLine, Shield, Sun, UserRound, UsersRound, X } from 'lucide-react';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import { trainerModels } from '../../shared/trainers';
import { routes } from '../../shared/routes';
import { useAppShell } from './useAppShell';
import '../../styles/global.scss';
import './styles.scss';

const navigation = [routes.home, routes.pokedex, routes.regions, routes.api];
const mobileNavigation = [routes.home, routes.pokedex, routes.teams, routes.profile];
const mobileIcons = [Compass, ScanLine, UsersRound, UserRound];

export default function AppShell({ children }: PropsWithChildren) {
  const sticky = true;
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { scrolled, showTop, menuOpen, setMenuOpen } = useAppShell();
  const [userMenu, setUserMenu] = useState(false);
  const [shellError, setShellError] = useState<string | null>(null);
  const avatar = trainerModels.find(model => model.id === user?.trainerId);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#14231d' : '#eaf4ed');
  }, [theme, isDark]);

  useEffect(() => { setMenuOpen(false); setUserMenu(false); }, [pathname]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <div className='app-shell' id='app-shell'>
      <a className='skip-link' href='#main-content'>Skip to content</a>
      <header className={`app-header ${sticky ? 'is-sticky' : ''} ${scrolled ? 'is-scrolled' : ''}`} id='app-header'>
        <div className='system-strip' id='system-strip'>
          <div className='system-strip-inner page-width'>
            <span className='system-status'><span className='status-dot' /> Your adventure, connected.</span>
            <span className='system-edition'>THE ORIGINAL FOUR REGIONS <span> / </span> GEN I–IV</span>
          </div>
        </div>
        <div className='header-inner page-width'>
          <Link href='/' className='brand-link' aria-label='Pokedex Database home' id='brand-link'>
            <img src='/media/pokeball.png' alt='' className='brand-ball' />
            <span className='brand-title'>POKEDEX <span>DATABASE</span></span>
          </Link>
          <nav className='desktop-navigation' aria-label='Main navigation' id='desktop-navigation'>
            {navigation.map(route => (
              <Link
                key={route.path}
                href={route.path}
                id={`nav-${route.icon}`}
                className={`navigation-link ${pathname === route.path ? 'is-active' : ''}`}
                aria-current={pathname === route.path ? 'page' : undefined}
              >{route.label}{route.path === '/developers' && <Code2 size={13} />}</Link>
            ))}
          </nav>
          <div className='header-actions'>
            <button className='icon-button theme-toggle' id='theme-toggle' onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            {!loading && (user ? (
              <div className='user-menu-wrap'>
                <button className='trainer-avatar-button' id='trainer-avatar-button' onClick={() => setUserMenu(!userMenu)} aria-expanded={userMenu} aria-label={`Trainer ${user.name}, open profile menu`}>
                  {avatar ? <img src={avatar.image} alt='' /> : <span>{user.name.slice(0, 1).toUpperCase()}</span>}
                </button>
                {userMenu && <>
                  <button className='menu-dismiss' aria-label='Close trainer menu' onClick={() => setUserMenu(false)} />
                  <div className='user-dropdown' id='trainer-user-menu'>
                    <span className='dropdown-title'>Hey, {user.name}.</span>
                    <Link href='/profile'><UserRound size={16} /> Trainer profile</Link>
                    <Link href='/teams'><UsersRound size={16} /> My teams</Link>
                    <button onClick={async () => {
                      try { await signOut(); setUserMenu(false); setShellError(null); router.replace('/'); }
                      catch (error) { setShellError(error instanceof Error ? error.message : 'Unable To Sign Out'); }
                    }}><ArrowRight size={16} /> Sign out</button>
                    {shellError && <p className='dropdown-error' role='alert'>{shellError}</p>}
                  </div>
                </>}
              </div>
            ) : <>
              <Link href='/signin' className='header-signin' id='header-signin'>Sign in</Link>
              <Link href='/signup' className='button button-dark header-signup' id='header-signup'><span>Become a trainer</span><ArrowRight size={16} /></Link>
            </>)}
            <button className='icon-button mobile-menu-toggle' id='mobile-menu-toggle' aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {menuOpen && <nav className='mobile-menu page-width' id='mobile-menu' aria-label='More navigation'>
          {navigation.map(route => <Link href={route.path} key={route.path} className='mobile-menu-link'>{route.label}<ArrowRight size={17} /></Link>)}
          <Link href='/about' className='mobile-menu-link'>About the database<ArrowRight size={17} /></Link>
          {!user && <Link href='/signup' className='button button-dark'>Become a trainer<ArrowRight size={17} /></Link>}
        </nav>}
      </header>
      <main className='app-main' id='main-content'>{children}</main>
      <footer className='app-footer' id='app-footer'>
        <div className='footer-main page-width'>
          <div className='footer-brand'>
            <Link href='/' className='brand-link'><img src='/media/pokeball.png' alt='' className='brand-ball' /><span className='brand-title'>POKEDEX <span>DATABASE</span></span></Link>
            <p>A little curiosity.<br />A whole world to discover.</p>
            <span className='footer-status'><span className='status-dot' /> Made for your next adventure.</span>
          </div>
          <div className='footer-links'><span>EXPLORE</span><Link href='/pokedex'>The Pokédex</Link><Link href='/regions'>The four regions</Link><Link href='/teams'>Your teams</Link></div>
          <div className='footer-links'><span>THE PROJECT</span><Link href='/about'>About</Link><Link href='/developers'>Developer API</Link><Link href='/contact'>Get in touch</Link></div>
          <div className='footer-note'><Shield size={19} /><p>An independent fan project.<br />Pokémon and character artwork belong to their respective owners.</p></div>
        </div>
        <div className='footer-bottom page-width'>
          <span>© {new Date().getFullYear()} Pokedex Database</span>
          <div><Link href='/privacy'>Privacy</Link><Link href='/terms'>Terms</Link></div>
          <a href='https://piratechs.com/' target='_blank' rel='noreferrer'>Crafted by <strong>Piratechs</strong><ArrowRight size={13} /></a>
        </div>
      </footer>
      <button className={`scroll-top icon-button ${showTop ? 'is-visible' : ''}`} id='scroll-top' aria-label='Scroll to top' tabIndex={showTop ? 0 : -1} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp size={20} /></button>
      <nav className='mobile-app-navigation' id='mobile-app-navigation' aria-label='App navigation'>
        {mobileNavigation.map((route, index) => { const Icon = mobileIcons[index]; return <Link href={route.path} key={route.path} id={`mobile-nav-${route.icon}`} className={pathname === route.path ? 'is-active' : ''} aria-current={pathname === route.path ? 'page' : undefined}><Icon size={20} /><span>{route.label === 'Trainer profile' ? 'Trainer' : route.label}</span></Link>; })}
      </nav>
    </div>
  );
}
