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
      return THEMES.NAVY;
    }
  });

  const changeTheme = (newTheme: ThemeName, e?: React.MouseEvent) => {
    const nextTheme = normalizeThemeName(newTheme);
    
    if (!(document as any).startViewTransition || !e) {
      setTheme(nextTheme);
      try { localStorage.setItem('usas_theme', nextTheme); } catch {}
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      const root = document.documentElement;
      root.classList.remove('theme-light', 'theme-navy', 'theme-oled', 'theme-emerald');
      root.classList.add(`theme-${nextTheme}`);
      if (nextTheme === THEMES.LIGHT) {
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
      }
      
      setTheme(nextTheme);
      try { localStorage.setItem('usas_theme', nextTheme); } catch {}
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ],
        },
        {
          duration: 250,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
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
