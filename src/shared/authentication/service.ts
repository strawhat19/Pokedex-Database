import * as Crypto from 'expo-crypto';
import { trainerModels } from '../trainers';
import { User, UserRecord } from '../models';
import { userScope } from './userScope';
import { createIdentity } from '../common/ids';
import { storage, queueStorage } from '../common/storage';
import { cleanName, isRecord, normalizeEmail } from '../common/values';
import { Providers, Roles } from '../../types/types';
import { sessionLifetimeMs, useLocalStorage } from '../config';
import { createCredential, verifyCredential } from './password';
import { AccountSnapshot, CredentialRecord, ProfileInput, PublicTrainer, Session, SignInInput, SignUpInput } from './types';

type PrivateDirectory = Record<string, string>;
const sessionKey = `private:session`;
const usersKey = `profiles:users`;
const directoryKey = `private:account-directory`;

const isUser = (value: unknown): value is UserRecord => isRecord(value)
  && typeof value.id === `string` && Number.isSafeInteger(value.number)
  && typeof value.name === `string` && typeof value.trainerId === `string`
  && typeof value.createdAt === `string` && typeof value.updatedAt === `string`
  && Object.values(Roles).includes(value.role as Roles) && value.provider === Providers.Local
  && (value.privacy === `private` || value.privacy === `public`);
const isUsers = (value: unknown): value is UserRecord[] => Array.isArray(value) && value.every(isUser);
const isDirectory = (value: unknown): value is PrivateDirectory => isRecord(value) && Object.values(value).every((entry) => typeof entry === `string`);
const isSession = (value: unknown): value is Session => isRecord(value) && typeof value.userId === `string` && typeof value.token === `string` && typeof value.expiresAt === `string` && Number.isFinite(Date.parse(value.expiresAt));
const isCredential = (value: unknown): value is CredentialRecord => isRecord(value)
  && typeof value.email === `string` && value.algorithm === `PBKDF2-SHA256`
  && typeof value.hash === `string` && /^[a-f0-9]{64}$/.test(value.hash)
  && typeof value.salt === `string` && /^[a-f0-9]{32}$/.test(value.salt)
  && Number.isSafeInteger(value.iterations) && Number(value.iterations) >= 100_000 && Number(value.iterations) <= 1_000_000;

const requireLocal = () => { if (!useLocalStorage) throw new Error(`Connect A Backend To Continue`); };
const validateProfile = (input: ProfileInput) => {
  const name = cleanName(input.name);
  if (name.length < 2 || name.length > 32) throw new Error(`Trainer Name Must Be 2–32 Characters`);
  if (!trainerModels.some((trainer) => trainer.id === input.trainerId)) throw new Error(`Choose A Trainer Model`);
  if (input.privacy !== undefined && input.privacy !== `public` && input.privacy !== `private`) throw new Error(`Choose A Valid Profile Visibility`);
  return { name, trainerId: input.trainerId };
};
const readUsers = async () => (await storage.get(usersKey, isUsers) ?? []).map((user) => new User(user).toRecord());
const createSession = async (userId: string) => {
  const session: Session = { userId, token: Crypto.randomUUID(), expiresAt: new Date(Date.now() + sessionLifetimeMs).toISOString() };
  await storage.set(sessionKey, session);
  return session;
};

export const authService = {
  async getSession(): Promise<Session | null> {
    if (!useLocalStorage) return null;
    const session = await storage.get(sessionKey, isSession);
    // An expired record grants no access; removing it here could erase a concurrent new session.
    if (session && Date.parse(session.expiresAt) <= Date.now()) return null;
    return session;
  },
  async getCurrentUser(): Promise<UserRecord | null> {
    const session = await authService.getSession();
    if (!session) return null;
    const user = (await readUsers()).find((entry) => entry.id === session.userId);
    if (!user) throw new Error(`Trainer Account Could Not Be Loaded`);
    const current = await authService.getSession();
    if (current?.token !== session.token) return null;
    return user;
  },
  async requireUser(expectedUserId?: string): Promise<UserRecord> {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error(`Sign In To Become A Trainer`);
    if (expectedUserId && expectedUserId !== user.id) throw new Error(`Trainer Session Changed — Please Try Again`);
    return user;
  },
  async getAccount(): Promise<AccountSnapshot> {
    const user = await authService.requireUser();
    const credential = await storage.get(userScope(user.id, `private:credential`), isCredential);
    if (!credential) throw new Error(`Trainer Account Could Not Be Loaded`);
    return { user, email: credential.email };
  },
  async signUp(input: SignUpInput, isCurrent: () => boolean = () => true): Promise<UserRecord> {
    requireLocal();
    const profile = validateProfile(input);
    const email = normalizeEmail(input.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error(`Enter A Valid Email Address`);
    if (input.password.length < 8 || input.password.length > 128) throw new Error(`Password Must Be 8–128 Characters`);
    const credential = await createCredential(email, input.password);
    return queueStorage(`account-data`, async () => {
      if (!isCurrent()) throw new Error(`Trainer Request Was Cancelled`);
      const directory = await storage.get(directoryKey, isDirectory) ?? {};
      if (directory[email]) throw new Error(`A Trainer With This Email Already Exists`);
      const users = await readUsers();
      const identity = await createIdentity(`User`, profile.name);
      const now = new Date().toISOString();
      const user = new User({ ...identity, ...profile, privacy: `private`, role: Roles.Subscriber, provider: Providers.Local, createdAt: now, updatedAt: now }).toRecord();
      await storage.set(userScope(user.id, `private:credential`), credential);
      await storage.set(usersKey, [...users, user]);
      await storage.set(directoryKey, { ...directory, [email]: user.id });
      if (!isCurrent()) throw new Error(`Trainer Request Was Cancelled`);
      await createSession(user.id);
      return user;
    });
  },
  async signIn(input: SignInInput, isCurrent: () => boolean = () => true): Promise<UserRecord> {
    requireLocal();
    const email = normalizeEmail(input.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || input.password.length < 1 || input.password.length > 128) throw new Error(`Email Or Password Is Incorrect`);
    const directory = await storage.get(directoryKey, isDirectory) ?? {};
    const userId = directory[email];
    if (!userId) throw new Error(`Email Or Password Is Incorrect`);
    const credential = await storage.get(userScope(userId, `private:credential`), isCredential);
    if (!credential || !(await verifyCredential(input.password, credential))) throw new Error(`Email Or Password Is Incorrect`);
    return queueStorage(`account-data`, async () => {
      if (!isCurrent()) throw new Error(`Trainer Request Was Cancelled`);
      const user = (await readUsers()).find((entry) => entry.id === userId);
      if (!user) throw new Error(`Trainer Account Could Not Be Loaded`);
      if (!isCurrent()) throw new Error(`Trainer Request Was Cancelled`);
      await createSession(user.id);
      return user;
    });
  },
  async updateProfile(input: ProfileInput): Promise<UserRecord> {
    const profile = validateProfile(input);
    const actor = await authService.requireUser();
    return queueStorage(`account-data`, async () => {
      const current = await authService.requireUser(actor.id);
      const user = new User({ ...current, ...profile, privacy: input.privacy ?? current.privacy, updatedAt: new Date().toISOString() }).toRecord();
      await storage.set(usersKey, (await readUsers()).map((entry) => entry.id === current.id ? user : entry));
      return user;
    });
  },
  async signOut(): Promise<void> { await queueStorage(`account-data`, () => storage.remove(sessionKey)); },
  async getPublicProfiles(): Promise<PublicTrainer[]> {
    return (await readUsers()).filter((user) => user.privacy === `public`).map(({ id, name, trainerId }) => ({ id, name, trainerId }));
  },
};
