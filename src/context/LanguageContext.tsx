import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations } from '../i18n/translations';
import type { LanguageContextValue, LanguageCode } from '../types/usas';

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLang] = useState<LanguageCode>('ms');

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ms' ? 'en' : 'ms'));
  };

  const t = (key: string) => {
    if (typeof key !== 'string') return key;
    const keys = key.split('.');
    
    let value: unknown = translations[lang];
    for (const k of keys) {
      value = typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[k] : undefined;
    }
    if (typeof value === 'string') return value;

    let fallbackValue: unknown = translations['ms'];
    for (const k of keys) {
      fallbackValue = typeof fallbackValue === 'object' && fallbackValue !== null ? (fallbackValue as Record<string, unknown>)[k] : undefined;
    }
    return typeof fallbackValue === 'string' ? fallbackValue : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
