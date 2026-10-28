// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * Absolute URLs are required for canonical, hreflang, Open Graph and the
 * sitemap. Resolution order:
 *   1. SITE_URL              - explicit override, use this for a custom domain.
 *   2. VERCEL_PROJECT_PRODUCTION_URL - set by Vercel, the production alias.
 *   3. VERCEL_URL            - set by Vercel, the current deployment alias.
 *   4. localhost             - local builds.
 */
const toUrl = (value) => {
  if (!value) return undefined;
  return value.startsWith('http') ? value : `https://${value}`;
};

const SITE_URL =
  toUrl(process.env.SITE_URL) ??
  toUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  toUrl(process.env.VERCEL_URL) ??
  'http://localhost:4321';

// Images shown by each route, so Google can index them from the sitemap.
const pageImages = {
  '/': ['/og-image.jpg', '/assets/patio-01.avif'],
  '/suite/1/': ['/assets/habitacion-01/habitacion-01.avif'],
  '/suite/2/': ['/assets/habitacion-02/habitacion-01.avif'],
  '/suite/3/': ['/assets/habitacion-03/habitacion-01.avif'],
  '/suite/4/': ['/assets/habitacion-04/habitacion-01.avif'],
};

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es-AR',
          en: 'en-US',
          pt: 'pt-BR',
        },
      },
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const images = pageImages[pathname];
        if (images) {
          item.img = images.map((src) => ({
            url: new URL(src, SITE_URL).href,
          }));
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
