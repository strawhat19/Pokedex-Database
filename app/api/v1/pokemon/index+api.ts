import { preflight, respond } from '../../../../src/server/http';
import { listPokemon, parsePokemonQuery } from '../../../../src/server/pokemon';

export const OPTIONS = preflight;
export const GET = (request: Request) => respond(request, async () => {
  const filters = parsePokemonQuery(new URL(request.url));
  const { data, pagination } = await listPokemon(filters);
  return { data, meta: { filters, pagination } };
});
