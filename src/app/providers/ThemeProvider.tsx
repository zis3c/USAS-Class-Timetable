import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ThemeContextValue, ThemeName } from '@/shared/types/usas';
import { normalizeThemeName } from '@/shared/lib/storage';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEMES: Record<string, ThemeName> = {
  NAVY: 'navy',
  OLED: 'oled',
  EMERALD: 'emerald',
  LIGHT: 'light',
};

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    try {
      return normalizeThemeName(localStorage.getItem('usas_theme'));
    } catch {
      return THEMES.LIGHT;
    }
  });

  const changeTheme = (newTheme: ThemeName) => {
    const nextTheme = normalizeThemeName(newTheme);
    setTheme(nextTheme);
    try {
      localStorage.setItem('usas_theme', nextTheme);
    } catch {
      // ignore storage failures
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-navy', 'theme-oled', 'theme-emerald');
    root.classList.add(`theme-${theme}`);

    if (theme === THEMES.LIGHT) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
