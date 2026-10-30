import { describe, it, expect, vi } from 'vitest';
import { normalizeSubscription, registerPushDeviceConfig } from './registerPushDevice';

const SUB = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  expirationTime: null,
  keys: { p256dh: 'BPk', auth: 'xyz' }
};

describe('normalizeSubscription', () => {
  it('keeps endpoint + keys only, from an object or its JSON string', () => {
    const want = { endpoint: SUB.endpoint, keys: SUB.keys };
    expect(normalizeSubscription(SUB)).toEqual(want);
    expect(normalizeSubscription(JSON.stringify(SUB))).toEqual(want);
  });

  it('rejects what web-push could not send to', () => {
    expect(normalizeSubscription(null)).toBeNull();
    expect(normalizeSubscription('not json')).toBeNull();
    expect(normalizeSubscription({ ...SUB, endpoint: 'http://x.example/push' })).toBeNull();
    expect(normalizeSubscription({ ...SUB, endpoint: 'nope' })).toBeNull();
    expect(normalizeSubscription({ endpoint: SUB.endpoint, keys: { p256dh: 'a' } })).toBeNull();
  });
});

describe('registerPushDevice', () => {
  const run = (strapi: any, userId = '1') =>
    (registerPushDeviceConfig.graphqlOperation as any)(
      { subscription: SUB },
      { userId, fetch: vi.fn() },
      { strapi }
    );

  it('returns the existing machshir of this user instead of a second row', async () => {
    const execute = vi.fn().mockResolvedValueOnce({
      data: { machshirs: { data: [{ id: '9', attributes: { users_permissions_user: { data: { id: '1' } } } }] } }
    });
    await expect(run({ execute })).resolves.toEqual({ data: { machshirId: '9', created: false } });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("creates one for the JWT's user even when another user holds the endpoint", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce({
        data: { machshirs: { data: [{ id: '9', attributes: { users_permissions_user: { data: { id: '2' } } } }] } }
      })
      .mockResolvedValueOnce({ data: { createMachshir: { data: { id: '10' } } } });
    await expect(run({ execute })).resolves.toEqual({ data: { machshirId: '10', created: true } });
    const [qid, vars] = execute.mock.calls[1];
    expect(qid).toBe('467createMachshir');
    expect(vars.uid).toBe('1');
    expect(JSON.parse(vars.jsoni)).toEqual({ endpoint: SUB.endpoint, keys: SUB.keys });
  });
});
