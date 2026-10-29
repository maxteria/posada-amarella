# Posada Amarella

Marketing site for a rural guesthouse: hero, suite listings, and one gallery page per suite. Static build, no backend, no database. Booking enquiries go out through WhatsApp or Airbnb.

## Stack

- [Astro](https://astro.build) 7 with the static output preset
- [Tailwind CSS](https://tailwindcss.com) 4 through the Vite plugin
- `@astrojs/sitemap` for `sitemap-index.xml`

No client framework, no runtime dependencies. The only JavaScript that ships is a handful of inline modules for the theme toggle, the language switcher, the mobile menu, the gallery lightbox, and the floating actions.

## Getting started

```sh
pnpm install
pnpm dev      # http://localhost:4321
```

```sh
pnpm build    # writes dist/
pnpm preview  # serve dist/ locally
pnpm test     # build, then run the smoke tests against dist/
```

## Routes

| Route | Content |
| --- | --- |
| `/` | Spanish landing page |
| `/en/`, `/pt/` | English and Portuguese landing pages |
| `/suite/1` … `/suite/4` | Gallery for one suite, grouped by room area |

The three landing pages are hand-maintained and share structure but not content. When you change a shared component, check all of them.

## Project layout

```
src/
  components/    Header, Footer, SuiteSection, FloatingActions, toggles
  layouts/       BaseLayout: head metadata, theme bootstrap
  pages/         index.astro, en/, pt/, suite/[suite].astro, robots.txt.ts
  styles/        global.css (design tokens)
public/
  assets/        every photo, one folder per suite plus shared areas
  *.png, *.ico   icons and the link-preview image
design/          source art for the logo and favicons (not published)
tests/           smoke tests over the built HTML
```

Suite galleries read their images from `public/assets/` at build time with `fs.readdirSync`, so adding a photo means dropping the file into the right folder — no code change.

## Metadata

`BaseLayout` emits canonical, hreflang, Open Graph, Twitter Card and `LodgingBusiness` JSON-LD. All of it needs an absolute site URL, resolved at build time in this order:

1. `SITE_URL`
2. `VERCEL_PROJECT_PRODUCTION_URL` (set by Vercel)
3. `VERCEL_URL` (set by Vercel)
4. `http://localhost:4321`

On Vercel no configuration is required. To move to a custom domain, set `SITE_URL` in the Vercel project environment variables — it takes precedence over everything else.

`public/og-image.jpg` is the link-preview image: 1200x630 JPEG kept under 300KB so messaging apps render it. `pnpm test` fails if it regresses on size or format.

## Deployment

Vercel builds `pnpm build` and serves `dist/`. Any static host works the same way.

## Tests

`tests/build.test.js` asserts on the generated HTML rather than on components: link-preview tags, canonical and locale signals, sitemap contents, `robots.txt`, and page chrome. They are smoke tests, not unit tests — they catch a broken build, not a broken design decision.
