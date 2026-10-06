import * as Crypto from 'expo-crypto';
import { storage, queueStorage } from './storage';

export const createIdentity = async (type: string, name: string) => queueStorage(`ids:${type}`, async () => {
  const key = `counters:${type}`;
  const previous = await storage.get<number>(key, (value): value is number => Number.isSafeInteger(value) && Number(value) >= 0) ?? 0;
  const number = previous + 1;
  await storage.set(key, number);
  const slug = name.trim().replace(/[^a-zA-Z0-9]+/g, `-`).replace(/^-|-$/g, ``).slice(0, 36) || `Record`;
  const date = new Date().toISOString().slice(0, 10);
  return { number, id: `${type}_${number}_${slug}_${date}_${Crypto.randomUUID()}` };
});
