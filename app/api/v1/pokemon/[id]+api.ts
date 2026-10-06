import { preflight, respond } from '../../../../src/server/http';
import { getPokemonDetail, resolvePokemonID } from '../../../../src/server/pokemon';

export const OPTIONS = preflight;
export const GET = (request: Request, { id }: Record<string, string>) => respond(request, async () => ({
  data: await getPokemonDetail(await resolvePokemonID(id)),
}));
