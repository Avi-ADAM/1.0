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
      { userId, jwt: 'user-jwt', fetch: vi.fn() },
      { strapi }
    );

  const rows = (...r: any[]) => ({ data: { machshirs: { data: r } } });

  it('returns the existing machshir of this user instead of a second row', async () => {
    // jsoni comes back either as the stringified subscription or as an object (legacy rows).
    const execute = vi
      .fn()
      .mockResolvedValueOnce(
        rows(
          { id: '8', attributes: { jsoni: { ...SUB, endpoint: 'https://fcm.googleapis.com/fcm/send/other' } } },
          { id: '9', attributes: { jsoni: JSON.stringify(SUB) } }
        )
      );
    await expect(run({ execute })).resolves.toEqual({ data: { machshirId: '9', created: false } });
    expect(execute).toHaveBeenCalledTimes(1);
    const [qid, vars] = execute.mock.calls[0];
    expect(qid).toBe('46getUserMachshirs');
    expect(vars).toEqual({ uid: '1' });
  });

  it('creates one when the endpoint is new for this user or only on an archived row', async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(rows({ id: '9', attributes: { jsoni: JSON.stringify(SUB), archived: true } }))
      .mockResolvedValueOnce({ data: { createMachshir: { data: { id: '10' } } } });
    await expect(run({ execute })).resolves.toEqual({ data: { machshirId: '10', created: true } });
    const [qid, vars, jwt] = execute.mock.calls[1];
    expect(qid).toBe('467createMachshir');
    expect(jwt).toBe('user-jwt');
    expect(vars.uid).toBe('1');
    expect(JSON.parse(vars.jsoni)).toEqual({ endpoint: SUB.endpoint, keys: SUB.keys });
  });
});
