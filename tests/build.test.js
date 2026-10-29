import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

/** Every page the build is expected to emit, mapped to the locale it declares. */
const pages = {
  'index.html': 'es',
  'en/index.html': 'en',
  'pt/index.html': 'pt',
  'suite/1/index.html': 'es',
  'suite/2/index.html': 'es',
  'suite/3/index.html': 'es',
  'suite/4/index.html': 'es',
};

const locales = { es: 'es_AR', en: 'en_US', pt: 'pt_BR' };

/**
 * The suite gallery pages use a minimal layout: their own back-link header and
 * no site footer. The credit only exists on the three landing pages.
 */
const pagesWithFooter = ['index.html', 'en/index.html', 'pt/index.html'];

/** Maps a built HTML file to the pathname it serves. */
const pathnameOf = (page) => `/${page.replace(/index\.html$/, '')}`;

const read = (relativePath) => readFileSync(join(dist, relativePath), 'utf8');

/** Returns the first capture group of a regex, or undefined. */
const capture = (html, pattern) => html.match(pattern)?.[1];

const ogImage = (html) =>
  capture(html, /<meta property="og:image" content="([^"]+)"/);

const canonical = (html) =>
  capture(html, /<link rel="canonical" href="([^"]+)"/);

const hreflangs = (html) =>
  [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);

describe('build output', () => {
  test('dist exists and contains every expected page', () => {
    assert.ok(existsSync(dist), 'dist/ is missing - run `astro build` first');
    for (const page of Object.keys(pages)) {
      assert.ok(existsSync(join(dist, page)), `missing built page: ${page}`);
    }
  });
});

describe('link previews', () => {
  test('every page emits an absolute og:image pointing at og-image.jpg', () => {
    for (const [page, locale] of Object.entries(pages)) {
      const image = ogImage(read(page));
      assert.ok(image, `${page} has no og:image`);
      assert.match(
        image,
        /^https?:\/\/.+\/og-image\.jpg$/,
        `${page} og:image is not an absolute URL: ${image} (locale ${locale})`,
      );
    }
  });

  test('every page declares the 1200x630 image dimensions apps use to crop', () => {
    for (const page of Object.keys(pages)) {
      const html = read(page);
      assert.equal(
        capture(html, /<meta property="og:image:width" content="([^"]+)"/),
        '1200',
        `${page} og:image:width`,
      );
      assert.equal(
        capture(html, /<meta property="og:image:height" content="([^"]+)"/),
        '630',
        `${page} og:image:height`,
      );
      assert.equal(
        capture(html, /<meta property="og:image:type" content="([^"]+)"/),
        'image/jpeg',
        `${page} og:image:type`,
      );
    }
  });

  test('every page uses a large Twitter card', () => {
    for (const page of Object.keys(pages)) {
      assert.equal(
        capture(read(page), /<meta name="twitter:card" content="([^"]+)"/),
        'summary_large_image',
        `${page} twitter:card`,
      );
    }
  });

  test('og-image.jpg is a JPEG under the 300KB WhatsApp preview limit', () => {
    const file = join(dist, 'og-image.jpg');
    assert.ok(existsSync(file), 'og-image.jpg was not copied to dist/');

    const size = statSync(file).size;
    assert.ok(size < 300 * 1024, `og-image.jpg is ${size} bytes, over 300KB`);

    const header = readFileSync(file).subarray(0, 3);
    assert.deepEqual(
      [...header],
      [0xff, 0xd8, 0xff],
      'og-image.jpg is not a JPEG',
    );
  });
});

describe('canonical and locale signals', () => {
  test('every page has an absolute canonical URL', () => {
    for (const page of Object.keys(pages)) {
      const href = canonical(read(page));
      assert.ok(href, `${page} has no canonical link`);
      assert.match(href, /^https?:\/\//, `${page} canonical is not absolute: ${href}`);
    }
  });

  test('canonical and og:image agree on the same origin', () => {
    for (const page of Object.keys(pages)) {
      const html = read(page);
      assert.equal(
        new URL(canonical(html)).origin,
        new URL(ogImage(html)).origin,
        `${page} canonical and og:image disagree on the origin`,
      );
    }
  });

  test('every page advertises all three languages plus x-default', () => {
    for (const page of Object.keys(pages)) {
      const langs = hreflangs(read(page));
      for (const expected of ['es', 'en', 'pt', 'x-default']) {
        assert.ok(
          langs.includes(expected),
          `${page} missing hreflang="${expected}" (found: ${langs.join(', ')})`,
        );
      }
    }
  });

  test('each page declares its own og:locale', () => {
    for (const [page, locale] of Object.entries(pages)) {
      assert.equal(
        capture(read(page), /<meta property="og:locale" content="([^"]+)"/),
        locales[locale],
        `${page} og:locale`,
      );
    }
  });

  test('every page has a non-empty title and description', () => {
    for (const page of Object.keys(pages)) {
      const html = read(page);
      assert.ok(
        capture(html, /<title>([^<]+)<\/title>/),
        `${page} has an empty title`,
      );
      assert.ok(
        capture(html, /<meta name="description" content="([^"]+)"/),
        `${page} has an empty description`,
      );
    }
  });

  test('every page embeds LodgingBusiness structured data with an image', () => {
    for (const page of Object.keys(pages)) {
      const raw = capture(
        read(page),
        /<script type="application\/ld\+json">([^<]+)<\/script>/,
      );
      assert.ok(raw, `${page} has no JSON-LD block`);

      const data = JSON.parse(raw);
      assert.equal(data['@type'], 'LodgingBusiness', `${page} JSON-LD type`);
      assert.ok(data.image, `${page} JSON-LD has no image`);
    }
  });
});

describe('discovery', () => {
  test('sitemap lists every page', () => {
    const sitemap = read('sitemap-0.xml');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    assert.equal(locs.length, Object.keys(pages).length, 'unexpected page count in sitemap');
    const paths = locs.map((loc) => new URL(loc).pathname);
    for (const page of Object.keys(pages)) {
      assert.ok(
        paths.includes(pathnameOf(page)),
        `sitemap is missing ${page} (expected ${pathnameOf(page)})`,
      );
    }
  });

  test('sitemap references page images for rich results', () => {
    const sitemap = read('sitemap-0.xml');
    assert.match(sitemap, /<image:loc>[^<]+og-image\.jpg<\/image:loc>/);
  });

  test('robots.txt is generated with an absolute sitemap URL', () => {
    const robots = read('robots.txt');
    assert.match(robots, /^User-agent: \*$/m);
    assert.match(robots, /^Allow: \/$/m);
    assert.match(
      robots,
      /^Sitemap: https?:\/\/.+\/sitemap-index\.xml$/m,
      'robots.txt sitemap is missing or not absolute',
    );
  });
});

describe('page chrome', () => {
  test('every landing page credits Maxteria with a link to Instagram', () => {
    for (const page of pagesWithFooter) {
      const html = read(page);
      assert.match(html, /Powered by/i, `${page} is missing the credit`);
      assert.match(
        html,
        /href="https:\/\/www\.instagram\.com\/maxteria\.js\/"/,
        `${page} is missing the Maxteria Instagram link`,
      );
    }
  });

  test('every page renders the floating WhatsApp button', () => {
    for (const page of Object.keys(pages)) {
      const html = read(page);
      assert.match(html, /id="scroll-to-top"/, `${page} is missing the scroll-to-top button`);
      assert.match(
        html,
        /class="fixed right-4 bottom-4 z-40[^"]*"[\s\S]*?wa\.me\/5492244420276/,
        `${page} is missing the fixed WhatsApp action`,
      );
    }
  });

  test('no page references the removed Astro favicon', () => {
    for (const page of Object.keys(pages)) {
      assert.doesNotMatch(
        read(page),
        /favicon\.svg/,
        `${page} still references the old Astro favicon`,
      );
    }
  });
});
