import React, { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ms');

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ms' ? 'en' : 'ms'));
  };

  const t = (key) => {
    if (typeof key !== 'string') return key;
    const keys = key.split('.');
    
    let value = translations[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    if (value !== undefined) return value;

    let fallbackValue = translations['ms'];
    for (const k of keys) {
      fallbackValue = fallbackValue?.[k];
    }
    return fallbackValue !== undefined ? fallbackValue : key;
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
