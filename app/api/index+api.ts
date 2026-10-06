import { apiDirectory, preflight, respond } from '../../src/server/http';

export const OPTIONS = preflight;
export const GET = (request: Request) => respond(request, () => ({ data: apiDirectory() }), false);
