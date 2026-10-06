# Pokedex Database

An Expo, React Native and TypeScript app inspired by MyDex. The first version pairs a responsive landing page with a real Pokémon HTTP API and device-local trainer accounts, teams and votes.

## Local setup

Dependencies are installed. From this directory, open the web app with:

```sh
npm run web
```

Expo serves the app and its API together, normally at `http://localhost:8081`. Public images and fonts use `/media/`; Expo reserves `/assets/` for Metro bundles. This is a Node application; opening the folder directly through XAMPP does not run the Expo API.

For native development, copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_ORIGIN` to the running Expo server’s LAN URL, such as `http://192.168.1.10:8081`. The device must be able to reach that server. Then use `npm start`, `npm run ios` or `npm run android`. A physical phone must use the computer’s LAN address rather than `localhost`.

## Interface

The web landing includes a sticky header, a Charizard feature, text reveals, a Poké Ball opening loader, Pokémon entry skeletons, search, generation and type filters, shiny artwork, alternate game descriptions, evolution details, regional starters, an API section and a footer. Small screens use a bottom app navigation bar. Light and dark modes share the same trainer and Pokémon state.

Original game trainer sprites are available during sign-up, sign-in and profile editing: FireRed/LeafGreen Red and Leaf, HeartGold/SoulSilver Ethan and Lyra, Emerald Brendan and May, and Platinum Lucas and Dawn. These are the original pixel sprites rather than full-size character illustrations. Normal and shiny Pokémon artwork and the existing MyDex Poké Ball are bundled for the landing artwork.

Web has a manifest and production service worker. The service worker provides an offline reconnection page and caches local artwork; the full Pokédex still needs a connection. Browser installation depends on browser support and a secure origin. Native views share services with the web app but have not been packaged for app stores.

## Trainer storage

`src/shared/config.ts` owns the single `useLocalStorage` flag, enabled by default. Browser persistence uses localStorage, and native persistence uses AsyncStorage. Versioned records and per-account keys keep user profiles, credentials, teams and votes separate.

Passwords use PBKDF2-SHA256 with a random salt and 210,000 iterations. Accounts and sessions are a device demo: there is no production authentication backend, email verification, password recovery or cross-device synchronization. Sessions expire and signing out revokes the local session. A future backend must enforce identity and authorization independently of the client.

Teams have capacities of 3, 6 or 10 Pokémon. Signed-out visitors can browse freely; voting and adding to a team prompt them to become a trainer. Vote counters start at zero and reflect actual votes from accounts on the same device. They are not shared community totals.

## Pokémon API

The app fetches Pokémon through Expo Router HTTP handlers backed by [PokéAPI](https://pokeapi.co/docs/v2). The API uses versioned JSON envelopes, request IDs, bounded in-memory caching, upstream deadlines, bounded request concurrency and a development rate limit.

| Endpoint | Purpose |
| --- | --- |
| `/api` | Directory, connection metadata and available operations |
| `/api/health` | Process health and cache status |
| `/api/status` | Health alias |
| `/api/v1/pokemon` | Paginated entries and filters |
| `/api/v1/pokemon/{id}` | Detail by species name or National Dex number |
| `/api/v1/pokemon/{id}/evolutions` | Evolution branches, methods and constraints |
| `/openapi.json` | OpenAPI 3.1 contract |
| `/developers` | Human-readable API reference and live request example |

List parameters are `q`, `generation`, `type`, `shiny`, `limit` and `offset`. The maximum page size is 24. For example:

```text
/api/v1/pokemon?generation=1&type=fire&limit=8&offset=0
/api/v1/pokemon/charizard
/api/v1/pokemon/1/evolutions
```

Species and English game descriptions are restricted to generations I–IV, National Dex #001–493. Stats, types and abilities reflect current upstream data. Evolution branches exclude later species, and explicitly versioned methods are restricted through HeartGold/SoulSilver. Unversioned methods and special triggers may need additional game-specific requirements; responses retain original upstream constraint fields and explain that limitation. [PokéAPI evolution documentation](https://pokeapi.co/docs/v2#evolution-chains) describes the upstream data.

Trainer accounts, teams and votes use local service equivalents and are not exposed through public HTTP endpoints. API health reports the actual process state, without claiming that it has just probed upstream availability.

## Future RapidAPI integration

The API contract can support a later listing, but this preview has no RapidAPI integration or paid access. Before selling it, configure hosting, gateway authentication, billing, production identity where needed, shared caching and distributed rate limits. Confirm rights to commercially distribute Pokémon data and artwork.

`API_KEY` is an optional server-only key. Leave it unset for the public development app. Enabling it protects `/api/v1/*` and requires a server-side proxy for browser/native access; never put it in an `EXPO_PUBLIC_` variable. `API_ALLOWED_ORIGINS` lists additional browser origins. Enable `API_TRUST_PROXY` only behind a trusted proxy that overwrites forwarded IP headers.

## Structure

Thin routes live in `app/`. Components own web/native views and Sass/native styles under `src/components/`. Shared models, authentication, theme, routes and trainer persistence live under `src/shared/`. Pokémon HTTP implementation is server-only under `src/server/`, with a typed client facade in `src/api/pokemon.ts`.

Public routes include discovery, the catalog, regions, API docs, About, Contact, Terms and Privacy. Trainer access routes render the same account/team panels used by landing actions. Common account and information aliases redirect to canonical routes.

## Review and deployment

The project’s `AGENTS.md` reserves verification for the user. No app run, build, typecheck, tests or UI checks were performed. Source review addressed integration, nullable state, request cancellation, account transitions and accessibility, but runtime behavior remains unverified. Dependency installation reported npm advisories; review those before production deployment.

After reviewing the source, the available commands are:

```sh
npm run typecheck
npm run export:web
npm run serve
```

The server export needs a supported Node/Expo server deployment to retain API routes; a static-only Apache directory cannot serve them. See [Expo API routes](https://docs.expo.dev/router/web/api-routes/) for deployment options.

## Asset sources

Source URLs and bundled font licenses are recorded in [asset sources](public/media/ASSETS.md). Assets come from the existing MyDex project and publicly published repositories. Pokémon characters and artwork remain the property of their respective owners. No leaked or unpublished material is included.
