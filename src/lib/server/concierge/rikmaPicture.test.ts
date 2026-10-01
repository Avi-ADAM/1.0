import { describe, expect, it, vi } from 'vitest';
import { resolveRikmaPictureId, uploadAvatarSvg } from './rikmaPicture.js';

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body, text: async () => '' }) as Response;
const base = { baseUrl: 'https://strapi.test', jwt: 'JWT' };

describe('resolveRikmaPictureId — whose choice wins', () => {
  it("the customer's pick wins and nothing is uploaded", async () => {
    const fetch = vi.fn();
    const id = await resolveRikmaPictureId({
      ...base, fetch, wishName: 'שיפוץ', chosenId: '77', wishLogoId: '5'
    });
    expect(id).toBe('77');
    expect(fetch).not.toHaveBeenCalled();
  });

  it("then the wish's own logo", async () => {
    const fetch = vi.fn();
    const id = await resolveRikmaPictureId({ ...base, fetch, wishName: 'שיפוץ', wishLogoId: '5' });
    expect(id).toBe('5');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('otherwise makes one: an SVG with the medal and the product words, uploaded as the user', async () => {
    const fetch = vi.fn().mockResolvedValue(ok([{ id: 321 }]));
    const id = await resolveRikmaPictureId({
      ...base, fetch, wishName: 'פינת עבודה ביתית: שולחן עץ והרכבת מחשב'
    });
    expect(id).toBe('321');

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://strapi.test/api/upload');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer JWT');
    const file = (init.body as FormData).get('files') as File;
    expect(file.type).toBe('image/svg+xml');
    const svg = await file.text();
    expect(svg).toContain('>פינת עבודה</text>');
    expect(svg).toContain('data:image/jpeg;base64,'); // the medal travels inside the file
  });

  it('a failed upload gives no picture instead of failing the partnership', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad = vi.fn().mockResolvedValue({ ok: false, status: 413, text: async () => 'too big' } as Response);
    expect(await resolveRikmaPictureId({ ...base, fetch: bad, wishName: 'שיפוץ' })).toBeNull();

    const boom = vi.fn().mockRejectedValue(new Error('network'));
    expect(await resolveRikmaPictureId({ ...base, fetch: boom, wishName: 'שיפוץ' })).toBeNull();
    warn.mockRestore();
  });
});

describe('uploadAvatarSvg', () => {
  it('tolerates an upload answer with no file in it', async () => {
    const fetch = vi.fn().mockResolvedValue(ok([]));
    expect(await uploadAvatarSvg({ svg: '<svg/>', ...base, fetch })).toBeNull();
  });
});
