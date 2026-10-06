import { join } from 'node:path';
import { createRequestHandler } from 'expo-server/adapter/vercel';

export default createRequestHandler({
  build: join(process.cwd(), `dist/server`),
});
