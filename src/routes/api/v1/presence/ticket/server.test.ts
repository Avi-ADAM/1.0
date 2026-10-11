import { describe, it, expect, vi, beforeEach } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env }));

const m = vi.hoisted(() => ({ member: true, hidden: false, fail: false }));
vi.mock('$lib/server/p2p/membership.js', () => ({
  isRikmaMember: vi.fn(async () => {
    if (m.fail) throw new Error('strapi down');
    return m.member;
  }),
  hidesPresence: vi.fn(async () => m.hidden)
}));

const { POST } = await import('./+server');
const { readTicket } = await import('$lib/server/p2p/ticket.js');

const SECRET = 'a-long-enough-test-secret';

function call(body: unknown, { uid = '7', type = 'application/json' } = {}) {
  const request = new Request('http://x/api/v1/presence/ticket', {
    method: 'POST',
    headers: { 'content-type': type },
    body: JSON.stringify(body)
  });
  return (POST as any)({ request, locals: { uid }, fetch: vi.fn() });
}

const status = async (p: Promise<Response>) => {
  try {
    return (await p).status;
  } catch (e: any) {
    return e?.status;
  }
};

beforeEach(() => {
  env.P2P_TICKET_SECRET = SECRET;
  Object.assign(m, { member: true, hidden: false, fail: false });
});

describe('POST /api/v1/presence/ticket', () => {
  it('a member gets a ticket for themselves and this rikma', async () => {
    const res = await call({ projectId: '82' });
    const body = await res.json();
    expect(body.hidden).toBe(false);
    expect(readTicket(body.ticket, SECRET)).toMatchObject({ uid: '7', projectId: '82' });
  });

  it('a member who switched presence off gets no ticket', async () => {
    m.hidden = true;
    const body = await (await call({ projectId: '82' })).json();
    expect(body).toEqual({ hidden: true });
  });

  it('refuses non-members, guests, bad input and an unreachable Strapi', async () => {
    m.member = false;
    expect(await status(call({ projectId: '82' }))).toBe(403);
    m.member = true;
    expect(await status(call({ projectId: '82' }, { uid: '' }))).toBe(401);
    expect(await status(call({ projectId: '82 OR 1' }))).toBe(400);
    expect(await status(call({ projectId: '82' }, { type: 'text/plain' }))).toBe(415);
    m.fail = true;
    expect(await status(call({ projectId: '82' }))).toBe(502);
  });

  it('no secret configured — 404, the page shows nothing', async () => {
    env.P2P_TICKET_SECRET = '';
    expect(await status(call({ projectId: '82' }))).toBe(404);
  });
});
