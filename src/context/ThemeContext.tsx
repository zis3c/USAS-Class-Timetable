import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ThemeContextValue, ThemeName } from '../types/usas';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEMES: Record<string, ThemeName> = {
  NAVY: 'navy',       // USAS Royal Navy & Gold (Default)
  OLED: 'oled',       // OLED Pure Black
  EMERALD: 'emerald', // USAS Emerald Green
  LIGHT: 'light'      // Clean Light Mode
};

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    try {
      const savedTheme = localStorage.getItem('usas_theme') as ThemeName | null;
      return savedTheme || THEMES.LIGHT;
    } catch (e) {
      return THEMES.LIGHT;
    }
  });

  const changeTheme = (newTheme: ThemeName) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('usas_theme', newTheme);
    } catch (e) {}
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
