import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
  NAVY: 'navy',       // USAS Royal Navy & Gold (Default)
  OLED: 'oled',       // OLED Pure Black
  EMERALD: 'emerald', // USAS Emerald Green
  LIGHT: 'light'      // Clean Light Mode
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('usas_theme') || THEMES.LIGHT;
    } catch (e) {
      return THEMES.LIGHT;
    }
  });

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('usas_theme', newTheme);
    } catch (e) {}
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-navy', 'theme-oled', 'theme-emerald');
    root.classList.add(`theme-${theme}`);
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
