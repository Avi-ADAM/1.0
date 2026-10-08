/**
 * The chat bot acts as the session user — never as the `userId` in the body.
 *
 * The workflow's tools run with `isInternalBot: true` (ownership checks
 * relaxed, some actions executed in-process under the admin token), so the id
 * in that context is the whole authorization story. These tests pin it to
 * `locals.uid`.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const setMcpContext = vi.fn();
const sendToSer = vi.fn(async () => ({}));
const runStart = vi.fn(async () => ({ status: 'success', result: { reply: 'ok' } }));
const getWorkflow = vi.fn(() => ({ createRun: async () => ({ start: runStart, resume: runStart }) }));
const nonregGenerate = vi.fn(async () => ({ text: 'hi guest', response: { messages: [] } }));

vi.mock('$env/static/private', () => ({ GEMINI_API_KEY: 'test' }));
vi.mock('$lib/translations', () => ({ t: { get: (k: string) => k } }));
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: (...a: unknown[]) => sendToSer(...a) }));
vi.mock('$lib/server/mcpContext', () => ({
  setMcpContext: (...a: unknown[]) => setMcpContext(...a),
  clearMcpContext: vi.fn()
}));
vi.mock('../../../mastra', () => ({ mastra: { getWorkflow: (...a: unknown[]) => getWorkflow(...a) } }));
vi.mock('../../../mastra/agents/nonreg-bot.js', () => ({
  createUnregisteredBotAgent: () => ({ generate: nonregGenerate })
}));

const { POST } = await import('./+server');

function call(body: Record<string, unknown>, uid: string | false) {
  const request = new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return POST({ request, fetch: vi.fn(), locals: { uid } } as any);
}

/** Every user id the tools were ever told to act as. */
function contextUserIds() {
  return setMcpContext.mock.calls.map(([ctx]: any[]) => String(ctx.userId));
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  setMcpContext.mockClear();
  sendToSer.mockClear();
  runStart.mockClear();
  getWorkflow.mockClear();
  nonregGenerate.mockClear();
});

describe('/api/chat identity', () => {
  it('acts as locals.uid when the body names another user', async () => {
    const res = await call({ userId: '99', messages: [{ role: 'user', content: 'שלום' }] }, '7');
    expect(res.status).toBe(200);

    expect(contextUserIds()).toEqual(['7']);
    expect(setMcpContext.mock.calls[0][0]).toMatchObject({ userId: '7', isInternalBot: true });
    expect(runStart).toHaveBeenCalledTimes(1);
    expect(runStart.mock.calls[0][0].inputData.userId).toBe('7');
  });

  it('ignores the legacy user.id the same way', async () => {
    await call({ user: { id: 99 }, payload: { text: 'hello', history: [] } }, '7');
    expect(contextUserIds()).toEqual(['7']);
    expect(runStart.mock.calls[0][0].inputData.userId).toBe('7');
  });

  it('reads the timer-edit missions of the session user, not the body user', async () => {
    await call({ userId: '99', messages: [{ role: 'user', content: 'edit my timer hours' }] }, '7');
    expect(sendToSer).toHaveBeenCalled();
    for (const [vars] of sendToSer.mock.calls as any[]) expect(vars).toEqual({ id: '7' });
  });

  it('a guest who names a user stays a guest', async () => {
    const res = await call({ userId: '99', messages: [{ role: 'user', content: 'hello' }] }, false);
    const body = await res.json();

    expect(body.agentType).toBe('nonregistered');
    expect(getWorkflow).not.toHaveBeenCalled();
    expect(sendToSer).not.toHaveBeenCalled();
    expect(contextUserIds()).toEqual(['anonymous']);
    expect(setMcpContext.mock.calls[0][0].isInternalBot).toBe(false);
  });

  it('a signed-in user who sends no userId is still themselves', async () => {
    await call({ messages: [{ role: 'user', content: 'hello' }] }, '7');
    expect(contextUserIds()).toEqual(['7']);
  });
});
