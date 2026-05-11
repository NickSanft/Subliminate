import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
export type Resolved = 'light' | 'dark';

type ThemeContext = {
  pref: ThemePref;
  resolved: Resolved;
  set: (pref: ThemePref) => void;
};

const STORAGE_KEY = 'subliminate.theme';
const Ctx = createContext<ThemeContext | null>(null);

function readSystem(): Resolved {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(): ThemePref {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPref] = useState<ThemePref>(() => readStored());
  const [system, setSystem] = useState<Resolved>(() => readSystem());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolved: Resolved = pref === 'system' ? system : pref;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  const value = useMemo<ThemeContext>(
    () => ({
      pref,
      resolved,
      set: (next: ThemePref) => {
        setPref(next);
        if (typeof window !== 'undefined') {
          if (next === 'system') window.localStorage.removeItem(STORAGE_KEY);
          else window.localStorage.setItem(STORAGE_KEY, next);
        }
      },
    }),
    [pref, resolved],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
