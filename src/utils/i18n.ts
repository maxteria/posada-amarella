import es from '../i18n/es.json';
import en from '../i18n/en.json';
import pt from '../i18n/pt.json';

const translations = { es, en, pt } as const;

export type Lang = keyof typeof translations;

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang === 'en' || lang === 'pt') return lang;
  return 'es';
}

export function useTranslations(lang: Lang) {
  return function t(key: string) {
    const keys = key.split('.');
    let value: any = translations[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
}
