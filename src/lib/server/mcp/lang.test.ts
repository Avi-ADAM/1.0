import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { STRAPI_API_NEW: 'svc' } }));
vi.mock('$lib/server/strapiUrl.js', () => ({ STRAPI_URL: 'https://strapi.test' }));

const { resolveMcpLang, langFromAcceptLanguage, isOAuthKeyName, fetchUserLang, _clearLangCache } =
  await import('./lang');

describe('langFromAcceptLanguage', () => {
  it('takes the highest-weighted supported language', () => {
    expect(langFromAcceptLanguage('fr-FR,fr;q=0.9,es;q=0.8,en;q=0.5')).toBe('es');
    expect(langFromAcceptLanguage('en-US,en;q=0.9,he;q=0.8')).toBe('en');
    expect(langFromAcceptLanguage('he;q=0.2, ar;q=0.7')).toBe('ar');
  });
  it('returns null when nothing is supported or the header is absent', () => {
    expect(langFromAcceptLanguage('fr,de')).toBeNull();
    expect(langFromAcceptLanguage(null)).toBeNull();
    expect(langFromAcceptLanguage('*')).toBeNull();
  });
});

describe('resolveMcpLang', () => {
  it('the stored profile language wins over the header', () => {
    expect(resolveMcpLang({ storedLang: 'ru', acceptLanguage: 'en' })).toBe('ru');
  });
  it('an unsupported stored language (fr) falls through to the header', () => {
    expect(resolveMcpLang({ storedLang: 'fr', acceptLanguage: 'es-ES' })).toBe('es');
  });
  it('no signal: English for an OAuth key, Hebrew for a personal one', () => {
    expect(resolveMcpLang({ keyName: 'MCP · Claude' })).toBe('en');
    expect(resolveMcpLang({ keyName: 'MCP' })).toBe('he');
    expect(resolveMcpLang({})).toBe('he');
  });
  it('recognises OAuth key names', () => {
    expect(isOAuthKeyName('MCP · OAuth')).toBe(true);
    expect(isOAuthKeyName('MCP')).toBe(false);
    expect(isOAuthKeyName(null)).toBe(false);
  });
});

describe('fetchUserLang', () => {
  beforeEach(() => _clearLangCache());

  it('reads the profile lang once and caches it', async () => {
    const f = vi.fn(async () =>
      new Response(JSON.stringify({ data: { usersPermissionsUser: { data: { attributes: { lang: 'en' } } } } }))
    );
    expect(await fetchUserLang('7', f as any)).toBe('en');
    expect(await fetchUserLang('7', f as any)).toBe('en');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('never throws — a failed read is no stored language', async () => {
    const f = vi.fn(async () => {
      throw new Error('down');
    });
    expect(await fetchUserLang('8', f as any)).toBeNull();
  });
});
