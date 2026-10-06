import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storagePrefix, storageVersion, useLocalStorage } from '../config';

type Envelope<T> = { version: number; data: T };
const operationQueues = new Map<string, Promise<unknown>>();
const memoryStorage = new Map<string, string>();
const keyFor = (key: string) => `${storagePrefix}:${key}`;
const isBrowser = () => Platform.OS === `web` && typeof window !== `undefined`;

export const storage = {
  async get<T>(key: string, validate?: (value: unknown) => value is T): Promise<T | null> {
    try {
      const fullKey = keyFor(key);
      const raw = !useLocalStorage ? memoryStorage.get(fullKey) ?? null
        : isBrowser() ? window.localStorage.getItem(fullKey) : await AsyncStorage.getItem(fullKey);
      if (raw === null) return null;
      const parsed: Envelope<T> = JSON.parse(raw);
      if (!parsed || parsed.version !== storageVersion || !(`data` in parsed) || (validate && !validate(parsed.data))) {
        throw new Error(`Saved Data Needs Recovery`);
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof Error && error.message === `Saved Data Needs Recovery`) throw error;
      throw new Error(`Device Storage Could Not Be Read`);
    }
  },
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const fullKey = keyFor(key);
      const raw = JSON.stringify({ version: storageVersion, data });
      if (!useLocalStorage) memoryStorage.set(fullKey, raw);
      else if (isBrowser()) window.localStorage.setItem(fullKey, raw);
      else await AsyncStorage.setItem(fullKey, raw);
    } catch {
      throw new Error(`Device Storage Is Full Or Unavailable`);
    }
  },
  async remove(key: string): Promise<void> {
    try {
      const fullKey = keyFor(key);
      if (!useLocalStorage) memoryStorage.delete(fullKey);
      else if (isBrowser()) window.localStorage.removeItem(fullKey);
      else await AsyncStorage.removeItem(fullKey);
    } catch {
      throw new Error(`Device Storage Could Not Be Updated`);
    }
  },
};

/** Serialize local read-modify-write operations, including number allocation. */
export const queueStorage = <T>(scope: string, operation: () => Promise<T>): Promise<T> => {
  const execute = () => typeof navigator !== `undefined` && navigator.locks
    ? navigator.locks.request(`${storagePrefix}:${scope}`, operation)
    : operation();
  const run = (operationQueues.get(scope) ?? Promise.resolve()).catch(() => undefined).then(execute);
  operationQueues.set(scope, run);
  void run.finally(() => {
    if (operationQueues.get(scope) === run) operationQueues.delete(scope);
  }).catch(() => undefined);
  return run;
};
