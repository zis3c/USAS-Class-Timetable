import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations } from '@/shared/i18n/translations';
import type { LanguageContextValue, LanguageCode } from '@/shared/types/usas';
import { lookupTranslationValue } from '@/shared/lib/translation';

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
    const activeValue = lookupTranslationValue(translations[lang], key);
    if (activeValue) return activeValue;

    const fallbackValue = lookupTranslationValue(translations.ms, key);
    return fallbackValue || key;
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
