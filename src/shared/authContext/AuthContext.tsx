import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { authAPI } from '../../api/auth';
import { UserRecord } from '../models';
import { errorMessage } from '../common/values';
import { ProfileInput, SignInInput, SignUpInput } from '../authentication/types';

export interface AuthContextValue {
  user: UserRecord | null;
  loading: boolean;
  error: string | null;
  signIn: (input: SignInInput) => Promise<UserRecord>;
  signUp: (input: SignUpInput) => Promise<UserRecord>;
  updateProfile: (input: ProfileInput) => Promise<UserRecord>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const revision = useRef(0);
  const hydrate = useCallback(async () => {
    const current = revision.current;
    try {
      const next = await authAPI.getCurrentUser();
      if (current === revision.current) { setUser(next); setError(null); }
    } catch (failure) {
      if (current === revision.current) {
        setUser(null); setError(errorMessage(failure));
        await authAPI.signOut().catch(() => undefined);
      }
    } finally { if (current === revision.current) setLoading(false); }
  }, []);

  useEffect(() => {
    void hydrate();
    const timer = setInterval(() => void hydrate(), 30_000);
    const subscription = AppState.addEventListener(`change`, (state) => { if (state === `active`) void hydrate(); });
    const onStorage = () => void hydrate();
    if (typeof window !== `undefined`) window.addEventListener(`storage`, onStorage);
    return () => { clearInterval(timer); subscription.remove(); if (typeof window !== `undefined`) window.removeEventListener(`storage`, onStorage); };
  }, [hydrate]);

  const value = useMemo<AuthContextValue>(() => ({
    user, loading, error,
    signIn: async (input) => {
      const current = ++revision.current;
      try {
        const next = await authAPI.signIn(input, () => current === revision.current);
        if (current !== revision.current) throw new Error(`Trainer Request Was Cancelled`);
        setUser(next); setError(null);
        return next;
      } catch (failure) { if (current === revision.current) setError(errorMessage(failure)); throw failure; }
      finally { if (current === revision.current) setLoading(false); }
    },
    signUp: async (input) => {
      const current = ++revision.current;
      try {
        const next = await authAPI.signUp(input, () => current === revision.current);
        if (current !== revision.current) throw new Error(`Trainer Request Was Cancelled`);
        setUser(next); setError(null);
        return next;
      } catch (failure) { if (current === revision.current) setError(errorMessage(failure)); throw failure; }
      finally { if (current === revision.current) setLoading(false); }
    },
    updateProfile: async (input) => { const current = ++revision.current; const next = await authAPI.updateProfile(input); if (current === revision.current) setUser(next); return next; },
    signOut: async () => { revision.current += 1; await authAPI.signOut(); setUser(null); setError(null); setLoading(false); },
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
