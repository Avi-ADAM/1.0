import { describe, it, expect, vi } from 'vitest';
import {
  bareDomain,
  buildPrompt,
  geminiGroundingProvider,
  groundedLines,
  resolveRedirect,
  type GeminiResponse
} from './gemini';

const REDIRECT = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc';

const response = (text: string, titles: string[]): GeminiResponse => ({
  candidates: [
    {
      content: { parts: [{ text }] },
      groundingMetadata: {
        groundingChunks: titles.map((title, i) => ({ web: { uri: `${REDIRECT}${i}`, title } }))
      }
    }
  ]
});

describe('bareDomain', () => {
  it('normalises urls and hosts', () => {
    expect(bareDomain('https://www.Photo.co.il/about?x=1')).toBe('photo.co.il');
    expect(bareDomain('photo.co.il')).toBe('photo.co.il');
    expect(bareDomain('Photo Studio')).toBeNull();
    expect(bareDomain('')).toBeNull();
  });
});

describe('groundedLines', () => {
  it('keeps only lines whose domain Google actually returned', () => {
    const text = [
      '1. סטודיו אור | studio-or.co.il | צלמת אירועים בחיפה | ₪2500 | חיפה',
      '2. Invented Ltd | invented.com | made up | - | -',
      'some prose line without cells'
    ].join('\n');
    const out = groundedLines(response(text, ['studio-or.co.il', 'other.com']));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      title: 'סטודיו אור',
      domain: 'studio-or.co.il',
      snippet: 'צלמת אירועים בחיפה',
      price: '₪2500',
      locationLabel: 'חיפה',
      chunk: { uri: `${REDIRECT}0`, domain: 'studio-or.co.il' }
    });
  });

  it('treats "-" cells as empty and matches subdomains', () => {
    const out = groundedLines(response('Shop | shop.example.com | sells tents | - | -', ['example.com']));
    expect(out[0].price).toBeNull();
    expect(out[0].locationLabel).toBeNull();
  });

  it('returns nothing without grounding', () => {
    expect(groundedLines(response('A | a.com | x | - | -', []))).toEqual([]);
    expect(groundedLines({})).toEqual([]);
  });

  it('lists a domain once', () => {
    const out = groundedLines(response('A | a.com | x\nA again | www.a.com | y', ['a.com']));
    expect(out).toHaveLength(1);
  });
});

describe('resolveRedirect', () => {
  it('follows Google\'s redirect when it lands on the same site', async () => {
    const f = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'https://www.a.com/page' } }));
    expect(await resolveRedirect(`${REDIRECT}0`, 'a.com', f as any)).toBe('https://www.a.com/page');
  });

  it('falls back to the home page on a mismatch or failure', async () => {
    const elsewhere = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'https://evil.com' } }));
    expect(await resolveRedirect(`${REDIRECT}0`, 'a.com', elsewhere as any)).toBe('https://a.com/');
    const broken = vi.fn(async () => {
      throw new Error('net');
    });
    expect(await resolveRedirect(`${REDIRECT}0`, 'a.com', broken as any)).toBe('https://a.com/');
  });

  it('never touches a url that is not a redirect', async () => {
    const f = vi.fn();
    expect(await resolveRedirect('https://a.com/x', 'a.com', f as any)).toBe('https://a.com/x');
    expect(f).not.toHaveBeenCalled();
  });
});

describe('geminiGroundingProvider', () => {
  it('sends only the prompt built from the query, with the search tool', async () => {
    const calls: any[] = [];
    const f = vi.fn(async (url: string, init: any) => {
      calls.push({ url, init });
      if (url.startsWith(REDIRECT)) {
        return new Response(null, { status: 302, headers: { location: 'https://a.com/' } });
      }
      return new Response(JSON.stringify(response('A | a.com | צלם | - | חיפה', ['a.com'])), { status: 200 });
    });
    const p = geminiGroundingProvider({ apiKey: 'k', model: 'm', fetchFn: f as any });
    const q = { key: 'm:0', need: 'צלם', locationLabel: 'חיפה', language: 'he', kind: 'mission' as const };
    const out = await p.search(q);
    expect(out).toEqual([
      { url: 'https://a.com/', title: 'A', snippet: 'צלם', price: null, locationLabel: 'חיפה' }
    ]);
    const body = JSON.parse(calls[0].init.body);
    expect(body.tools).toEqual([{ google_search: {} }]);
    expect(body.contents[0].parts[0].text).toBe(buildPrompt(q));
    expect(calls[0].init.headers['x-goog-api-key']).toBe('k');
    // The key never rides in the URL.
    expect(calls[0].url).not.toContain('k=');
  });

  it('is unavailable without a key and throws on an HTTP error', async () => {
    expect(geminiGroundingProvider({ apiKey: '', model: 'm' }).available()).toBe(false);
    const f = vi.fn(async () => new Response('no', { status: 429 }));
    const p = geminiGroundingProvider({ apiKey: 'k', model: 'm', fetchFn: f as any });
    await expect(
      p.search({ key: 'm:0', need: 'x', locationLabel: null, language: 'he', kind: 'mission' })
    ).rejects.toThrow('429');
  });
});
