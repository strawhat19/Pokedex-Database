export type InfoPageName = 'regions' | 'developers' | 'about' | 'contact' | 'terms' | 'privacy';

interface PageContent {
  title: string;
  intro: string;
  eyebrow: string;
  blocks: { title: string; text: string }[];
  action?: { label: string; href: string };
}

export const pageContent: Record<InfoPageName, PageContent> = {
  regions: {
    eyebrow: 'THE ORIGINAL FOUR',
    title: 'Every region has a story.',
    intro: 'From your first steps in Kanto to the legends of Sinnoh. Explore 493 Pokémon across the original four generations.',
    blocks: [],
  },
  developers: {
    eyebrow: 'POKEDEX DATABASE / API v1',
    title: 'Build your next adventure.',
    intro: 'A versioned JSON API for Pokémon #001–493, artwork, game descriptions, stats, and evolution requirements. The landing app uses these same endpoints.',
    blocks: [
      { title: 'A predictable contract', text: 'Every response includes success, data or error, a requestId, and metadata. List results include total, limit, offset, next and previous pagination fields. The maximum page size is 24 entries.' },
      { title: 'A clear data scope', text: 'Species and English game descriptions are limited to generations I–IV. Types, stats and abilities reflect current PokéAPI data. Evolution branches exclude later species; game-specific methods and special triggers may require additional in-game conditions.' },
      { title: 'Prepared for a future API product', text: 'The source includes OpenAPI 3.1, bounded caching, upstream timeouts, rate limits and optional server-side API key protection. A public RapidAPI listing, gateway authentication, billing, distributed rate limits and commercial asset rights still need to be configured before selling access.' },
      { title: 'Trainer data stays on your device', text: 'Accounts, votes and teams use shared local services. They are separate from the public Pokémon HTTP API. Production identity and shared community counters will require a backend.' },
    ],
  },
  about: {
    eyebrow: 'MADE FOR CURIOUS TRAINERS',
    title: 'A familiar adventure. A fresh start.',
    intro: 'Pokedex Database is an independent fan project inspired by MyDex, built as a smooth companion to the Pokémon games and anime.',
    blocks: [
      { title: 'The original four generations', text: 'Discover Pokémon from Kanto, Johto, Hoenn and Sinnoh. Explore normal and shiny artwork, read alternate descriptions from the games, and follow evolution paths.' },
      { title: 'A Pokédex that feels like yours', text: 'Choose a trainer from the original games, vote on your favorites, and build teams of 3, 6 or 10. This first version saves your trainer profile and teams locally on your device.' },
      { title: 'Built on a shared foundation', text: 'The web experience and native app views share Pokémon data, trainer state and persistence services. Pokémon data comes from PokéAPI. The trading card game is outside this first version.' },
      { title: 'An independent fan project', text: 'Pokedex Database is not affiliated with or endorsed by Nintendo, Game Freak, Creatures or The Pokémon Company. Pokémon names and character artwork belong to their respective owners.' },
    ],
    action: { label: 'Open the Pokédex', href: '/pokedex' },
  },
  contact: {
    eyebrow: 'LET’S TALK POKÉMON',
    title: 'A little conversation starts here.',
    intro: 'Have a suggestion, spotted an incorrect entry, or want to talk about the project? Get in touch with the creator.',
    blocks: [
      { title: 'Suggestions and field notes', text: 'When reporting an entry, include its National Pokédex number and the game version. Evolution requirements and descriptions can differ between games.' },
      { title: 'The project', text: 'Created by Piratechs. The contact address below is carried over from the original MyDex project.' },
    ],
    action: { label: 'Email the creator', href: 'mailto:rakib987@gmail.com' },
  },
  terms: {
    eyebrow: 'PROTOTYPE TERMS',
    title: 'A few things to know.',
    intro: 'This device-local prototype is an independent Pokémon fan project. These terms describe the current preview experience.',
    blocks: [
      { title: 'Use of the prototype', text: 'Browse the Pokédex and create local trainer profiles for personal exploration. Accounts in this version are device demos; they do not create a production online identity or shared community account.' },
      { title: 'Your saved data', text: 'Profiles, votes and teams stay in this browser or device. Clearing app storage, uninstalling the app or switching devices can remove access to them. Keep a separate record of anything you need to preserve.' },
      { title: 'Pokémon information and artwork', text: 'Information is sourced from PokéAPI and can vary between game versions. Pokémon and trainer artwork remain the property of their owners. Access to this prototype does not grant rights to resell or redistribute those assets.' },
      { title: 'API access', text: 'Public API access is available for local development, subject to server limits and upstream availability. This preview has no paid plan or service-level guarantee. Commercial distribution requires separate setup and rights review.' },
    ],
  },
  privacy: {
    eyebrow: 'YOUR DEVICE. YOUR ADVENTURE.',
    title: 'Privacy, in plain language.',
    intro: 'This first version keeps trainer accounts, profiles, votes and teams in browser local storage or native device storage.',
    blocks: [
      { title: 'What is stored', text: 'A trainer name, selected game character, profile settings, teams, votes and an expiring session are stored locally. Email and derived password credentials use separate account records. Passwords are hashed with PBKDF2 rather than stored as plain text.' },
      { title: 'What is shared', text: 'Local trainer profiles start private. This prototype does not upload accounts, teams or votes to a shared backend, and has no public profile feed or analytics integration.' },
      { title: 'Network requests', text: 'The app requests Pokémon information from its internal API, which fetches and caches data from PokéAPI. Some card artwork loads from public asset hosts. Those requests expose ordinary connection information to the hosting providers.' },
      { title: 'Sessions and device access', text: 'Signing out removes the local session while keeping the account and teams for your next visit. Someone with access to this device or its browser storage may be able to inspect stored data. Local demo authentication does not provide production account security.' },
      { title: 'Removing local data', text: 'Use your browser’s site-data controls or native app storage settings to remove this prototype’s stored records. Clearing storage removes local accounts and teams; there is no server copy or recovery service in this version.' },
    ],
    action: { label: 'Contact the creator', href: '/contact' },
  },
};
