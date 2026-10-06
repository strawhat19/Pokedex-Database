export const routes = {
  home: { path: '/', label: 'Discover', icon: 'compass' },
  pokedex: { path: '/pokedex', label: 'Pokédex', icon: 'scan' },
  regions: { path: '/regions', label: 'Regions', icon: 'map' },
  teams: { path: '/teams', label: 'My teams', icon: 'users', trainerOnly: true },
  api: { path: '/developers', label: 'API', icon: 'code' },
  profile: { path: '/profile', label: 'Trainer profile', icon: 'user', trainerOnly: true },
  signin: { path: '/signin', label: 'Sign in', icon: 'log-in' },
  signup: { path: '/signup', label: 'Become a trainer', icon: 'user-plus' },
  about: { path: '/about', label: 'About', icon: 'info' },
  terms: { path: '/terms', label: 'Terms', icon: 'file-text' },
  privacy: { path: '/privacy', label: 'Privacy', icon: 'shield' },
  contact: { path: '/contact', label: 'Contact', icon: 'mail' }
} as const;

export const routeAliases: Record<string, string> = {
  log: '/signin', sign: '/signin', login: '/signin', 'log-in': '/signin', 'sign-in': '/signin',
  new: '/signup', register: '/signup', subscribe: '/signup', 'sign-up': '/signup',
  edit: '/profile', account: '/profile', preferences: '/profile',
  info: '/about', company: '/about', aboutus: '/about', aboutme: '/about', 'about-us': '/about', 'about-me': '/about',
  contactme: '/contact', contactus: '/contact', getintouch: '/contact', 'contact-us': '/contact', 'contact-me': '/contact', 'get-in-touch': '/contact',
  'privacy-policy': '/privacy', 'terms-of-service': '/terms'
};
