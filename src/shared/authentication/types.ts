import { UserRecord } from '../models';
import { ProfilePrivacy } from '../../types/types';

export interface SignInInput { email: string; password: string }
export interface SignUpInput extends SignInInput { name: string; trainerId: string }
export interface ProfileInput { name: string; trainerId: string; privacy?: ProfilePrivacy }
export interface AccountSnapshot { user: UserRecord; email: string }
export interface Session { userId: string; expiresAt: string; token: string }
export interface CredentialRecord {
  salt: string;
  hash: string;
  email: string;
  iterations: number;
  algorithm: `PBKDF2-SHA256`;
}

export interface PublicTrainer {
  id: string;
  name: string;
  trainerId: string;
}
