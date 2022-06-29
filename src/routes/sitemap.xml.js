export async function get() {
    return {
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
            <loc>https://www.1lev1.world/</loc>
            <lastmod>2022-06-29T20:57:22+00:00</lastmod>
            <priority>1.00</priority>
            <changefreq>weekly</changefreq>
            </url>
            <url>
            <loc>https://www.1lev1.world/login</loc>
            <lastmod>2022-06-29T20:57:22+00:00</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.99</priority>
            </url>
            <url>
            <loc>https://shalom.1lev1.world/</loc>
            <lastmod>2022-06-12T23:42:27+00:00</lastmod>
            <priority>0.98</priority>
            </url>
            <url>
            <loc>https://shalom.1lev1.world/1-0/</loc>
            <lastmod>2022-06-12T23:42:27+00:00</lastmod>
            <priority>0.90</priority>
            </url>
            <url>
            <loc>https://shalom.1lev1.world/l/</loc>
            <lastmod>2022-06-12T23:42:27+00:00</lastmod>
            <priority>0.80</priority>
            </url>
            <url>
            <loc>https://shalom.1lev1.world/1/</loc>
            <lastmod>2022-06-12T23:42:27+00:00</lastmod>
            <priority>0.80</priority>
            </url>
            <url>
            <loc>https://shalom.1lev1.world/harmoni/</loc>
            <lastmod>2022-06-12T23:42:27+00:00</lastmod>
            <priority>0.80</priority>
            </url>
        <!-- <url> elements go here -->
      </urlset>
    `.trim()
    };
}