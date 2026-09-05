/* Sitemap for the public surface of the app.
 *
 * Two rules this file has to keep in step with the rest of the SEO setup:
 *
 * 1. Every <loc> must be the page's own canonical. The site serves all five
 *    locales from the same address and picks one from `?lang=` / cookie /
 *    Accept-Language, so the canonical is the bare path, and the localized
 *    variants are `?lang=` alternates — exactly the hreflang table in
 *    app.html. The old file listed `/he` as the homepage and invented
 *    `/en/consensus`-style paths that were never routes.
 * 2. Nothing behind the login wall. /lev, /moach and /me 303 a guest back to
 *    "/", so a crawler only ever sees the homepage there.
 */

const SITE = 'https://1lev1.com';
const LOCALES = ['he', 'en', 'ar', 'ru', 'es'];

/** Canonical address of `path` in the default locale. */
const canonical = (path) => `${SITE}${path}`;

/** `?lang=` alternates + x-default, the set the whole site agrees on. */
function alternates(path) {
  const rows = LOCALES.map((l) => {
    const href = l === 'he' ? canonical(path) : `${canonical(path)}?lang=${l}`;
    return `      <xhtml:link rel="alternate" hreflang="${l}" href="${href}" />`;
  });
  rows.push(
    `      <xhtml:link rel="alternate" hreflang="x-default" href="${canonical(path)}" />`
  );
  return rows.join('\n');
}

/**
 * @param {{ path: string, lastmod: string, priority: string,
 *           changefreq: string, i18n?: boolean }} entry
 */
function urlEntry({ path, lastmod, priority, changefreq, i18n = true }) {
  return [
    '    <url>',
    `      <loc>${canonical(path)}</loc>`,
    `      <lastmod>${lastmod}</lastmod>`,
    `      <changefreq>${changefreq}</changefreq>`,
    `      <priority>${priority}</priority>`,
    i18n ? alternates(path) : null,
    '    </url>'
  ]
    .filter(Boolean)
    .join('\n');
}

const PAGES = [
  // Landing + the agreement/consensus entry points
  { path: '/', lastmod: '2026-08-13T00:00:00+00:00', priority: '1.00', changefreq: 'weekly' },
  { path: '/hascama', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.90', changefreq: 'monthly' },
  { path: '/consensus', lastmod: '2026-07-15T00:00:00+00:00', priority: '0.90', changefreq: 'weekly' },

  // Discovery — the public listings the homepage links into
  { path: '/project', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.95', changefreq: 'daily' },
  { path: '/availableMission', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.95', changefreq: 'daily' },
  { path: '/availiableResorce', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.90', changefreq: 'daily' },
  { path: '/gift', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.90', changefreq: 'daily' },
  { path: '/demand', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.90', changefreq: 'daily' },
  { path: '/quorum', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.80', changefreq: 'weekly' },
  { path: '/meeting', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.70', changefreq: 'weekly' },

  // Explanatory pages
  { path: '/guid', lastmod: '2026-08-03T00:00:00+00:00', priority: '0.85', changefreq: 'monthly' },
  { path: '/guid/ai', lastmod: '2026-08-03T00:00:00+00:00', priority: '0.60', changefreq: 'monthly' },
  { path: '/faq', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.80', changefreq: 'monthly' },
  { path: '/about', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.75', changefreq: 'monthly' },
  { path: '/grow', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.75', changefreq: 'monthly' },
  { path: '/love', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.70', changefreq: 'daily' },
  // Written, live, linked from the homepage - and missing from this list until
  // now, so nothing pointed a crawler at roughly 700 lines of copy. /solution
  // and /kir are deliberately NOT here: both are still placeholder drafts, and
  // they carry a noindex of their own so they stop borrowing the homepage's
  // title in search results.
  { path: '/why', lastmod: '2026-09-04T00:00:00+00:00', priority: '0.80', changefreq: 'monthly' },
  { path: '/uses', lastmod: '2026-09-04T00:00:00+00:00', priority: '0.75', changefreq: 'monthly' },
  // One of the three audience tracks the homepage used to walk everyone
  // through in a single scroll. High priority: it is a landing page for its
  // own search intent, not a supporting page.
  { path: '/no-boss', lastmod: '2026-09-04T00:00:00+00:00', priority: '0.85', changefreq: 'monthly' },

  // Entry points into the product
  { path: '/wish/new', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.85', changefreq: 'monthly' },
  { path: '/login', lastmod: '2026-08-13T00:00:00+00:00', priority: '0.50', changefreq: 'monthly', i18n: false }
];

export async function GET() {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...PAGES.map(urlEntry),
    '</urlset>'
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
  /* return {
        headers: {
            'Content-Type': 'application/xml'
        },
        body: `
      <?xml version="1.0" encoding="UTF-8" ?>
      <urlset
        xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="https://www.w3.org/1999/xhtml"
        xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"  
      >
            <url>
            <loc>https://1lev1.com/</loc>
            <lastmod>2023-06-29T20:57:22+00:00</lastmod>
            <priority>1.00</priority>
            <changefreq>weekly</changefreq>
            </url>
            <url>
            <loc>https://1lev1.com/login</loc>
            <lastmod>2023-06-29T20:57:22+00:00</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.99</priority>
            </url>
            <url>
            <loc>https://1lev1.com/love</loc>
            <lastmod>2023-06-29T20:57:22+00:00</lastmod>
            <priority>0.85</priority>
            <changefreq>daily</changefreq>
            </url>
            <url>
            <loc>https://1lev1.com/about</loc>
            <lastmod>2023-06-29T20:57:22+00:00</lastmod>
            <priority>0.95</priority>
            <changefreq>weekly</changefreq>
            </url>
            <url>
            <loc>https://1lev1.com/lev</loc>
            <lastmod>2023-06-29T20:57:22+00:00</lastmod>
            <priority>0.96</priority>
            <changefreq>always</changefreq>
            </url>     
            <url>
            <loc>https://1lev1.com/moach</loc>
            <lastmod>2023-06-29T20:57:22+00:00</lastmod>
            <priority>0.96</priority>
            <changefreq>always</changefreq>
            </url>  
            <url>
            <loc>https://1lev1.com/me</loc>
            <lastmod>2023-06-29T20:57:22+00:00</lastmod>
            <priority>1.00</priority>
            <changefreq>always</changefreq>
            </url>         
            <url>
            <loc>https://1lev1.com/en</loc>
            <lastmod>2023-06-29T20:57:22+00:00</lastmod>
            <priority>0.96</priority>
            <changefreq>always</changefreq>
            </url>    
            <url>
            <loc>https://1lev1.com/ar</loc>
            <lastmod>2023-06-29T20:57:22+00:00</lastmod>
            <priority>1.00</priority>
            <changefreq>always</changefreq>
            </url>                                                            
            <url>
            <loc>https://shalom.1lev1.world/</loc>
            <lastmod>2023-06-12T23:42:27+00:00</lastmod>
            <priority>0.98</priority>
            </url>
            <url>
            <loc>https://shalom.1lev1.world/1-0/</loc>
            <lastmod>2023-06-12T23:42:27+00:00</lastmod>
            <priority>0.90</priority>
            </url>
            <url>
            <loc>https://shalom.1lev1.world/l/</loc>
            <lastmod>2023-06-12T23:42:27+00:00</lastmod>
            <priority>0.80</priority>
            </url>
            <url>
            <loc>https://shalom.1lev1.world/1/</loc>
            <lastmod>2023-06-12T23:42:27+00:00</lastmod>
            <priority>0.80</priority>
            </url>
            <url>
            <loc>https://shalom.1lev1.world/harmoni/</loc>
            <lastmod>2023-06-12T23:42:27+00:00</lastmod>
            <priority>0.80</priority>
            </url>
      </urlset>
    `.trim()
    };
}*/