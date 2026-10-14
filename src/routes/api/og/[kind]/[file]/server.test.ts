import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The share-card endpoint without Strapi: `sendToSer` is replaced by a stub
 * that answers with the shapes the two queries return, and the route is
 * exercised end to end — validation, the fallbacks, the headers, and that
 * what comes back really is a PNG of the right size.
 */

const sendToSer = vi.fn();
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: (...args: unknown[]) => sendToSer(...args) }));

const { GET } = await import('./+server.js');

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function call(kind: string, file: string, search = '') {
  const url = new URL(`https://1lev1.com/api/og/${kind}/${file}${search}`);
  return (GET as any)({ params: { kind, file }, url, fetch: globalThis.fetch });
}

function pngSize(bytes: Uint8Array) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: dv.getUint32(16), height: dv.getUint32(20) };
}

const maagadNode = {
  id: 12,
  attributes: {
    name: 'קופסת ירקות שבועית מהמשק',
    canonical_desc: 'ירקות אורגניים',
    scope: 'local',
    frequency: 'weekly',
    status_maagad: 'offered',
    members: { data: [1, 2, 3, 4].map((i) => ({ id: i, attributes: { status_member: 'interested' } })) },
    categories: { data: [{ id: 1, attributes: { name: 'מזון' } }] },
    offers: {
      data: [
        {
          id: 5,
          attributes: {
            title: 'קופסה שבועית',
            signed_count: 7,
            min_participants: 10,
            max_participants: 25,
            sign_deadline: new Date(Date.now() + 4 * 86_400_000).toISOString(),
            status_offer: 'open',
            unit_price: 95,
            currency: { data: { attributes: { name: 'ILS' } } },
            recurrence: 'weekly'
          }
        }
      ]
    }
  }
};

describe('GET /api/og/[kind]/[file]', () => {
  beforeEach(() => sendToSer.mockReset());

  it('rejects anything that is not <digits>.png under a known kind', async () => {
    await expect(call('maagad', 'abc.png')).rejects.toMatchObject({ status: 404 });
    await expect(call('maagad', '12.svg')).rejects.toMatchObject({ status: 404 });
    await expect(call('rikma', '12.png')).rejects.toMatchObject({ status: 404 });
    expect(sendToSer).not.toHaveBeenCalled();
  });

  it('renders a 1200×630 PNG for a live pool, cached long, read with the service token', async () => {
    sendToSer.mockResolvedValueOnce({ data: { maagad: { data: maagadNode } } });
    const res: Response = await call('maagad', '12.png', '?lang=en&v=4-7-1-open');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toContain('s-maxage=86400');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 8)]).toEqual(PNG_MAGIC);
    expect(pngSize(bytes)).toEqual({ width: 1200, height: 630 });
    expect(res.headers.get('content-length')).toBe(String(bytes.length));
    // ({ id }, qid, 0, 0, svc = true, fetch)
    expect(sendToSer.mock.calls[0][0]).toEqual({ id: '12' });
    expect(sendToSer.mock.calls[0][1]).toBe('229queryMaagadFull');
    expect(sendToSer.mock.calls[0][4]).toBe(true);
  });

  it('falls back to the brand card (200, short cache) when the pool does not exist', async () => {
    sendToSer.mockResolvedValueOnce({ data: { maagad: { data: null } } });
    const res: Response = await call('maagad', '999.png');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(pngSize(bytes)).toEqual({ width: 1200, height: 630 });
  });

  it('never draws a private or draft wish, and survives a failing backend', async () => {
    sendToSer.mockResolvedValueOnce({
      data: { ratson: { data: { id: 3, attributes: { name: 'סודי', access_mode: 'personal' } } } }
    });
    const priv: Response = await call('wish', '3.png');
    expect(priv.headers.get('cache-control')).toBe('public, max-age=300');

    sendToSer.mockRejectedValueOnce(new Error('strapi down'));
    const down: Response = await call('wish', '4.png', '?lang=ar');
    expect(down.status).toBe(200);
    expect(down.headers.get('content-type')).toBe('image/png');
  });

  it('renders a public wish with its proposals count', async () => {
    sendToSer.mockResolvedValueOnce({
      data: {
        ratson: {
          data: {
            id: 7,
            attributes: {
              name: 'יום חופש לאמא ליום הולדתה',
              longDes: '<p>ספא, ארוחה, בייביסיטר</p>',
              status_ratson: 'open',
              access_mode: 'public',
              startDate: new Date(Date.now() + 10 * 86_400_000).toISOString(),
              location_hint: 'חיפה',
              totalbounti: 850,
              users_permissions_users: { data: [{ id: 1, attributes: { username: 'נעה' } }] },
              extracted_missions: [{}, {}, {}],
              extracted_resources: [{}]
            }
          }
        },
        ratsonProposals: { data: [{ id: 1 }, { id: 2 }] }
      }
    });
    const res: Response = await call('wish', '7.png');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(sendToSer.mock.calls[0][1]).toBe('105queryRatsonWithProposals');
  });
});
