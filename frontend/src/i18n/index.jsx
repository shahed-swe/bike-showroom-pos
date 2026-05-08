import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'lang';
const SUPPORTED = ['en', 'bn'];

function getInitialLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored)) return stored;
  return 'en';
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{${key}}`));
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (SUPPORTED.includes(next)) setLangState(next);
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'bn' : 'en'));
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = translations[lang] || translations.en;
      const fallback = translations.en[key];
      const raw = dict[key] ?? fallback ?? key;
      return interpolate(raw, vars);
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useT must be used within LanguageProvider');
  return ctx;
}
