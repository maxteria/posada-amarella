// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const SITE_URL = process.env.SITE_URL ?? 'https://posadaamarella.com';

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
  // Absolute URLs for canonical, hreflang and Open Graph tags.
  // Override with SITE_URL when deploying to a custom domain.
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
