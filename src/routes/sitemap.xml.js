import  { RequestHandler } from '@sveltejs/kit';
import { url, pages } from '$lib/constants'; // or wherever your relevant data is

export const get = async () => {
    const headers = {
        'Cache-Control': 'max-age=0, s-maxage=3600',
        'Content-Type': 'application/xml'
    };
    const body = `<?xml version="1.0" encoding="UTF-8" ?>
  <urlset
    xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
  >
    <url>
      <loc>${url}</loc>
      <changefreq>always</changefreq>
      <priority>1.0</priority>
    </url>
    ${pages
            .map(
                (page) => `
    <url>
      <loc>${url}/${page}</loc>
      <changefreq>daily</changefreq>
      <priority>0.5</priority>
    </url>
    `
            )
            .join('')}
  </urlset>`

    return {
        headers,
        body
    };
};