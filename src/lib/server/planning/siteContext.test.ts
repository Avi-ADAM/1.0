import { describe, expect, it, vi } from 'vitest';
import {
  fetchSiteSummary,
  htmlToText,
  normalizeSiteUrl,
  shouldAnalyzeSite,
  THIN_DESCRIPTION_CHARS
} from './siteContext';

describe('normalizeSiteUrl', () => {
  it('accepts a bare domain the way members type it', () => {
    expect(normalizeSiteUrl('example.com')?.href).toBe('https://example.com/');
    expect(normalizeSiteUrl('  www.example.co.il/about ')?.href).toBe(
      'https://www.example.co.il/about'
    );
  });

  it('keeps an explicit scheme', () => {
    expect(normalizeSiteUrl('http://example.com')?.protocol).toBe('http:');
  });

  it('refuses anything that is not http(s)', () => {
    for (const bad of ['file:///etc/passwd', 'ftp://example.com', 'javascript:alert(1)']) {
      expect(normalizeSiteUrl(bad)).toBeNull();
    }
  });

  it('refuses loopback, private and link-local hosts (SSRF)', () => {
    const blocked = [
      'http://localhost/',
      'http://127.0.0.1/',
      'http://0.0.0.0/',
      'http://10.1.2.3/',
      'http://172.16.5.4/',
      'http://192.168.1.1/',
      'http://169.254.169.254/latest/meta-data/',
      'http://100.64.0.1/',
      'http://[::1]/',
      'http://strapi.internal/',
      'http://printer.local/'
    ];
    for (const bad of blocked) {
      expect(normalizeSiteUrl(bad), bad).toBeNull();
    }
  });

  it('refuses non-standard ports and intranet names', () => {
    expect(normalizeSiteUrl('http://example.com:1337/')).toBeNull();
    expect(normalizeSiteUrl('http://intranet/')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(normalizeSiteUrl('')).toBeNull();
    expect(normalizeSiteUrl(null)).toBeNull();
    expect(normalizeSiteUrl(undefined)).toBeNull();
  });
});

describe('htmlToText', () => {
  it('pulls the title, meta description, headings and paragraphs', () => {
    const html = `
      <html><head>
        <title>גן הגג — Green Roofs</title>
        <meta name="description" content="We build rooftop gardens for schools.">
        <script>var x = "should not appear";</script>
        <style>.a { color: red }</style>
      </head><body>
        <nav><ul><li>Home</li><li>About</li></ul></nav>
        <h1>Rooftop gardens for schools</h1>
        <p>We design, build and maintain edible rooftop gardens.</p>
      </body></html>`;
    const text = htmlToText(html);
    expect(text).toContain('גן הגג');
    expect(text).toContain('We build rooftop gardens for schools.');
    expect(text).toContain('Rooftop gardens for schools');
    expect(text).toContain('edible rooftop gardens');
    expect(text).not.toContain('should not appear');
    expect(text).not.toContain('color: red');
    // Single-word nav items are dropped as navigation.
    expect(text).not.toMatch(/^Home$/m);
  });

  it('decodes entities and collapses whitespace', () => {
    expect(htmlToText('<p>Tools &amp; materials&nbsp;&mdash;   ready</p>')).toBe(
      'Tools & materials — ready'
    );
  });

  it('falls back to flat text for a div-only page', () => {
    const text = htmlToText('<body><div>Everything lives in divs here, sadly.</div></body>');
    expect(text).toContain('Everything lives in divs here');
  });

  it('de-duplicates repeated blocks', () => {
    const text = htmlToText('<p>Same line here.</p><p>Same line here.</p>');
    expect(text).toBe('Same line here.');
  });

  it('truncates to the cap', () => {
    const text = htmlToText(`<p>${'x'.repeat(5000)}</p>`, 100);
    expect(text.length).toBeLessThanOrEqual(100);
    expect(text.endsWith('…')).toBe(true);
  });

  it('returns empty for empty input rather than throwing', () => {
    expect(htmlToText('')).toBe('');
    expect(htmlToText('<html></html>')).toBe('');
  });
});

function htmlResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
    ...init
  });
}

describe('fetchSiteSummary', () => {
  it('reads a page and returns its gist', async () => {
    const fetchImpl = vi.fn(async () =>
      htmlResponse('<title>Roofs</title><p>We build rooftop gardens for schools.</p>')
    ) as unknown as typeof fetch;

    const res = await fetchSiteSummary('greenroofs.example', { fetchImpl });
    expect(res.ok).toBe(true);
    expect(res.text).toContain('rooftop gardens');
    expect(res.url).toBe('https://greenroofs.example/');
  });

  it('refuses an unusable URL without fetching anything', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const res = await fetchSiteSummary('http://127.0.0.1/', { fetchImpl });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('unusable-url');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('re-checks every redirect hop, so a redirect into the private net is refused', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } })
    ) as unknown as typeof fetch;

    const res = await fetchSiteSummary('https://evil.example', { fetchImpl });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('unsafe-redirect');
  });

  it('follows a safe redirect', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: 'https://www.example.com/home' } })
      )
      .mockResolvedValueOnce(htmlResponse('<p>The real page content is here.</p>')) as unknown as typeof fetch;

    const res = await fetchSiteSummary('https://example.com', { fetchImpl });
    expect(res.ok).toBe(true);
    expect(res.url).toBe('https://www.example.com/home');
  });

  it('reports an HTTP error instead of throwing', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 404 })) as unknown as typeof fetch;
    const res = await fetchSiteSummary('https://example.com', { fetchImpl });
    expect(res).toMatchObject({ ok: false, error: 'http-404' });
  });

  it('refuses a non-HTML body', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('%PDF-1.7', { status: 200, headers: { 'content-type': 'application/pdf' } })
    ) as unknown as typeof fetch;
    const res = await fetchSiteSummary('https://example.com/brochure.pdf', { fetchImpl });
    expect(res).toMatchObject({ ok: false, error: 'not-html' });
  });

  it('survives a network failure', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;
    const res = await fetchSiteSummary('https://example.com', { fetchImpl });
    expect(res).toMatchObject({ ok: false, error: 'fetch-failed' });
  });

  it('reports a page with no readable text as empty', async () => {
    const fetchImpl = vi.fn(async () => htmlResponse('<html><body></body></html>')) as unknown as typeof fetch;
    const res = await fetchSiteSummary('https://example.com', { fetchImpl });
    expect(res).toMatchObject({ ok: false, error: 'empty' });
  });
});

describe('shouldAnalyzeSite', () => {
  const link = 'https://example.com';

  it('reads the site when the description is too thin to plan from', () => {
    expect(shouldAnalyzeSite({ description: 'גן גג', linkToWebsite: link })).toBe(true);
    expect(shouldAnalyzeSite({ description: '', linkToWebsite: link })).toBe(true);
  });

  it('leaves a well-described rikma alone', () => {
    expect(
      shouldAnalyzeSite({ description: 'x'.repeat(THIN_DESCRIPTION_CHARS), linkToWebsite: link })
    ).toBe(false);
  });

  it('honours an explicit choice either way', () => {
    const rich = { description: 'x'.repeat(500), linkToWebsite: link };
    expect(shouldAnalyzeSite(rich, 'always')).toBe(true);
    expect(shouldAnalyzeSite({ description: '', linkToWebsite: link }, 'never')).toBe(false);
  });

  it('cannot read a site that is missing or unusable, even when asked to', () => {
    expect(shouldAnalyzeSite({ description: '', linkToWebsite: null }, 'always')).toBe(false);
    expect(shouldAnalyzeSite({ description: '', linkToWebsite: 'http://localhost' }, 'always')).toBe(
      false
    );
  });
});
