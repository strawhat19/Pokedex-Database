import * as Crypto from 'expo-crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { CredentialRecord } from './types';

const rounds = 210_000;
const hex = (value: Uint8Array) => Array.from(value, (byte) => byte.toString(16).padStart(2, `0`)).join(``);
const unhex = (value: string) => Uint8Array.from(value.match(/.{2}/g) ?? [], (pair) => parseInt(pair, 16));

const derive = async (password: string, salt: Uint8Array, iterations: number): Promise<string> => {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const key = await subtle.importKey(`raw`, new TextEncoder().encode(password), `PBKDF2`, false, [`deriveBits`]);
    const value = await subtle.deriveBits({ name: `PBKDF2`, salt: new Uint8Array(salt), iterations, hash: `SHA-256` }, key, 256);
    return hex(new Uint8Array(value));
  }
  return hex(await pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: 32, asyncTick: 10 }));
};

export const createCredential = async (email: string, password: string): Promise<CredentialRecord> => {
  const salt = await Crypto.getRandomBytesAsync(16);
  return { email, salt: hex(salt), hash: await derive(password, salt, rounds), iterations: rounds, algorithm: `PBKDF2-SHA256` };
};

export const verifyCredential = async (password: string, record: CredentialRecord): Promise<boolean> => {
  const candidate = await derive(password, unhex(record.salt), record.iterations);
  if (candidate.length !== record.hash.length) return false;
  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) difference |= candidate.charCodeAt(index) ^ record.hash.charCodeAt(index);
  return difference === 0;
};
