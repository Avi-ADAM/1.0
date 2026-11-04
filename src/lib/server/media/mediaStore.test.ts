import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/strapiUrl.js', () => ({ STRAPI_URL: 'http://strapi.test' }));
vi.mock('$lib/server/adminToken.js', () => ({ adminToken: () => 'svc' }));
vi.mock('$lib/server/planning/siteContext.js', async () => {
  // The real host check, without the module's other imports.
  const blocked = (h: string) =>
    /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h === '::1';
  return { isBlockedHost: blocked };
});

const { safePublicUrl, fetchPublicImage, decodeBase64Image, storeCheckedImage, MediaRefused } = await import('./mediaStore');

const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const publicDns = async () => ['93.184.216.34'];

describe('safePublicUrl (SSRF)', () => {
  it('allows a public https URL', async () => {
    expect(await safePublicUrl('https://cdn.example.com/a.jpg', publicDns)).not.toBeNull();
  });
  it('blocks internal hosts, custom ports, credentials and other schemes', async () => {
    for (const u of [
      'http://localhost/a.jpg',
      'http://127.0.0.1/a.jpg',
      'http://169.254.169.254/latest/meta-data',
      'http://10.0.0.5/x.png',
      'https://example.com:8443/a.jpg',
      'https://user:pw@example.com/a.jpg',
      'file:///etc/passwd',
      'ftp://example.com/a.jpg'
    ]) {
      expect(await safePublicUrl(u, publicDns), u).toBeNull();
    }
  });
  it('blocks a public name that resolves to a private address', async () => {
    expect(await safePublicUrl('https://evil.example.com/a.jpg', async () => ['10.1.2.3'])).toBeNull();
    expect(await safePublicUrl('https://evil.example.com/a.jpg', async () => ['::ffff:127.0.0.1'])).toBeNull();
  });
});

describe('fetchPublicImage', () => {
  it('downloads a picture', async () => {
    const fetch = vi.fn(async () => new Response(JPG, { status: 200, headers: { 'content-type': 'image/jpeg' } }));
    const got = await fetchPublicImage('https://cdn.example.com/mug.jpg', { fetch, resolve: publicDns });
    expect(got.bytes.length).toBe(JPG.length);
    expect(got.fileName).toBe('mug.jpg');
  });
  it('refuses a redirect into the private network', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } }));
    await expect(fetchPublicImage('https://cdn.example.com/a.jpg', { fetch, resolve: publicDns })).rejects.toMatchObject({ code: 'url' });
  });
  it('stops reading past the size cap', async () => {
    const fetch = vi.fn(async () => new Response(new Uint8Array(2000), { status: 200 }));
    await expect(fetchPublicImage('https://cdn.example.com/a.jpg', { fetch, resolve: publicDns, maxBytes: 1000 })).rejects.toMatchObject({ code: 'size' });
  });
});

describe('decodeBase64Image', () => {
  it('reads a data: URL', () => {
    const got = decodeBase64Image(`data:image/jpeg;base64,${Buffer.from(JPG).toString('base64')}`);
    expect(got.declared).toBe('image/jpeg');
    expect(got.bytes[0]).toBe(0xff);
  });
  it('refuses base64 over the limit before decoding', () => {
    expect(() => decodeBase64Image('A'.repeat(5 * 1024 * 1024))).toThrow(MediaRefused);
  });
});

describe('storeCheckedImage', () => {
  it('never uploads a forbidden type', async () => {
    const fetch = vi.fn();
    await expect(
      storeCheckedImage({ bytes: new TextEncoder().encode('<svg/>'), declaredMime: 'image/svg+xml', fileName: 'x.svg', maxBytes: 1000, fetch })
    ).rejects.toMatchObject({ code: 'type' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('never uploads a file over the limit', async () => {
    const fetch = vi.fn();
    const big = new Uint8Array(2000);
    big.set(JPG);
    await expect(storeCheckedImage({ bytes: big, fileName: 'a.jpg', maxBytes: 1000, fetch })).rejects.toMatchObject({ code: 'size' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('uploads a real picture to Strapi with the session caption', async () => {
    const fetch = vi.fn(async (_url: string, init: any) => {
      const info = JSON.parse(init.body.get('fileInfo'));
      expect(info.caption).toBe('1lev1-upl:abc');
      return new Response(JSON.stringify([{ id: 77, url: 'https://cdn/x.jpg', name: 'a.jpg', mime: 'image/jpeg', width: 10, height: 20, size: 1 }]));
    });
    const stored = await storeCheckedImage({ bytes: JPG, fileName: 'a.jpg', maxBytes: 1000, caption: '1lev1-upl:abc', fetch });
    expect(stored).toMatchObject({ uploadId: '77', width: 10, height: 20 });
    expect(fetch.mock.calls[0][0]).toBe('http://strapi.test/api/upload');
  });
});
