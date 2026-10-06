import React, { createContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../common/storage';
import { ThemeName, ThemePalette, themePalettes } from '../../styles/theme/theme';

export interface ThemeContextValue {
  theme: ThemeName;
  isDark: boolean;
  palette: ThemePalette;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeName>(`light`);
  useEffect(() => {
    let mounted = true;
    void storage.get<ThemeName>(`preferences:theme`, (value): value is ThemeName => value === `light` || value === `dark`)
      .then((saved) => { if (mounted && saved) setTheme(saved); }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);
  const value = useMemo(() => ({
    theme, isDark: theme === `dark`, palette: themePalettes[theme],
    toggleTheme: () => setTheme((current) => {
      const next = current === `light` ? `dark` : `light`;
      void storage.set(`preferences:theme`, next).catch(() => undefined);
      return next;
    }),
  }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
