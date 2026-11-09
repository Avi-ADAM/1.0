import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendToSer = vi.fn();
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: (...args: unknown[]) => sendToSer(...args) }));

import { POST } from './+server';

const UNIQUE = { errors: [{ message: 'This attribute must be unique' }], data: { createChezin: null } };
const CREATED = { data: { createChezin: { data: { id: '900' } } } };

function row(attributes: Record<string, unknown> = {}) {
  return {
    data: {
      chezin: {
        data: {
          id: '838',
          attributes: {
            email: 'a@b.co',
            fullAgreement: false,
            createdAt: '2026-11-09T05:27:45Z',
            users_permissions_user: { data: null },
            assistant_sessions: { data: [] },
            ...attributes
          }
        }
      }
    }
  };
}

function call(body: Record<string, unknown>, jar: Record<string, string> = {}) {
  const set = vi.fn();
  const event = {
    request: new Request('https://www.1lev1.com/api/chezin', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        name: 'Noa',
        email: 'a@b.co',
        countries: ['104'],
        ...body
      })
    }),
    fetch: vi.fn(),
    url: new URL('https://www.1lev1.com/api/chezin'),
    cookies: { get: (k: string) => jar[k], set }
  };
  return Promise.resolve(POST(event as never)).then(async (res) => ({ body: await res.json(), set }));
}

describe('POST /api/chezin create', () => {
  beforeEach(() => sendToSer.mockReset());

  it('seats the cookies for a new signature', async () => {
    sendToSer.mockResolvedValueOnce(CREATED);
    const { body, set } = await call({});
    expect(body).toEqual(CREATED);
    expect(set).toHaveBeenCalledWith('fpval', '900', expect.objectContaining({ httpOnly: true }));
  });

  it('records a known source and language on a new signature', async () => {
    sendToSer.mockResolvedValue(CREATED);
    await call({ source: 'main', lang: 'he' });
    expect(sendToSer.mock.calls[1][0]).toEqual({ id: '900', source: 'main', signupLang: 'he' });
    expect(sendToSer.mock.calls[1][1]).toBe('chezinSetSource');
  });

  it('ignores an unknown source', async () => {
    sendToSer.mockResolvedValue(CREATED);
    await call({ source: 'admin' });
    expect(sendToSer).toHaveBeenCalledTimes(1);
  });

  it('keeps the signature when the source cannot be written', async () => {
    sendToSer.mockResolvedValueOnce(CREATED).mockRejectedValueOnce(new Error('unknown field'));
    const { body } = await call({ source: 'main' });
    expect(body).toEqual(CREATED);
  });

  it('carries on with the earlier signature this browser holds', async () => {
    sendToSer.mockResolvedValueOnce(UNIQUE).mockResolvedValueOnce(row());
    const { body, set } = await call({}, { fpval: '838' });
    expect(body.errors).toBeUndefined();
    expect(body.data.createChezin.data.id).toBe('838');
    expect(sendToSer.mock.calls[1][1]).toBe('386getChezinForAgentSign');
    expect(set).toHaveBeenCalledWith('fpval', '838', expect.anything());
  });

  it('matches the email without regard to case', async () => {
    sendToSer.mockResolvedValueOnce(UNIQUE).mockResolvedValueOnce(row({ email: 'A@B.co' }));
    const { body } = await call({}, { fpval: '838' });
    expect(body.data.createChezin.data.id).toBe('838');
  });

  it.each([
    ['no cookie', {}, undefined],
    ['a malformed cookie', { fpval: '1 or 1' }, undefined],
    ['a row of another email', { fpval: '838' }, row({ email: 'other@b.co' })],
    ['a row that already has an account', { fpval: '838' }, row({ users_permissions_user: { data: { id: '5' } } })]
  ])('reports alreadySigned and seats nothing with %s', async (_label, jar, found) => {
    sendToSer.mockResolvedValueOnce(UNIQUE);
    if (found) sendToSer.mockResolvedValueOnce(found);
    const { body, set } = await call({}, jar as Record<string, string>);
    expect(body.alreadySigned).toBe(true);
    expect(body.errors[0].message).toBe('This attribute must be unique');
    expect(set).not.toHaveBeenCalled();
  });

  it('does not let a short signature stand in for an extended one', async () => {
    sendToSer.mockResolvedValueOnce(UNIQUE).mockResolvedValueOnce(row({ fullAgreement: false }));
    const { body, set } = await call({ fullAgreement: true }, { fpval: '838' });
    expect(body.alreadySigned).toBe(true);
    expect(set).not.toHaveBeenCalled();
  });

  it('leaves any other Strapi error as it was', async () => {
    const other = { errors: [{ message: 'Forbidden' }], data: { createChezin: null } };
    sendToSer.mockResolvedValueOnce(other);
    const { body } = await call({}, { fpval: '838' });
    expect(body).toEqual(other);
    expect(sendToSer).toHaveBeenCalledTimes(1);
  });
});
