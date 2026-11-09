import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendToSer = vi.fn();
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: (...args: unknown[]) => sendToSer(...args) }));
const openLink = vi.fn();
vi.mock('$lib/server/signupNudge/token', () => ({ openLink: (...args: unknown[]) => openLink(...args) }));

import { POST } from './+server';

const call = (body: unknown) =>
  Promise.resolve(
    POST({
      request: new Request('https://api.1lev1.com/api/chezin/continue', { method: 'POST', body: JSON.stringify(body) }),
      fetch: vi.fn()
    } as never)
  ).then((r) => r.json());

const row = (attributes: Record<string, unknown>) => ({ data: { chezin: { data: { id: '838', attributes } } } });

describe('POST /api/chezin/continue', () => {
  beforeEach(() => {
    sendToSer.mockReset();
    openLink.mockReset();
  });

  it('opens a live link with the signature it names', async () => {
    openLink.mockReturnValue('838');
    sendToSer.mockResolvedValue(row({ name: 'Noa', email: 'a@b.co', countries: { data: [{ id: 104 }] } }));
    expect(await call({ action: 'open', t: 'x' })).toEqual({
      ok: true,
      id: '838',
      name: 'Noa',
      email: 'a@b.co',
      countries: ['104']
    });
    expect(openLink).toHaveBeenCalledWith('x', 'continue');
  });

  it('sends an existing account to login', async () => {
    openLink.mockReturnValue('838');
    sendToSer.mockResolvedValue(row({ email: 'a@b.co', users_permissions_user: { data: { id: '5' } } }));
    expect(await call({ action: 'open', t: 'x' })).toEqual({ ok: false, reason: 'registered' });
  });

  it('refuses a bad link without touching Strapi', async () => {
    openLink.mockReturnValue(null);
    expect(await call({ action: 'open', t: 'x' })).toEqual({ ok: false, reason: 'invalid' });
    expect(await call({ action: 'stop', t: 'x' })).toEqual({ ok: false, reason: 'invalid' });
    expect(sendToSer).not.toHaveBeenCalled();
  });

  it('records a removal, by the removal link only', async () => {
    openLink.mockReturnValue('838');
    sendToSer.mockResolvedValue({ data: { updateChezin: { data: { id: '838' } } } });
    expect(await call({ action: 'stop', t: 'x' })).toEqual({ ok: true });
    expect(openLink).toHaveBeenCalledWith('x', 'stop');
    expect(sendToSer.mock.calls[0][1]).toBe('chezinSetNoMail');
  });
});
