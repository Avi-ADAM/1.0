import { describe, it, expect } from 'vitest';

// secret.ts refuses to load without a nonce (it protects the api-key hashes
// too), so the env has to be set before the module is imported — hence the
// top-level await imports below rather than static ones.
process.env.API_KEY_NONCE ||= 'test-nonce-that-is-definitely-long-enough-1234567890';

const { webhookSecretForKey, signWebhookBody, verifyWebhookSignature } = await import('./secret.js');
const { eventForAction } = await import('./dispatch.js');
const { wants } = await import('./targets.js');

describe('webhookSecretForKey', () => {
  it('is stable for a key and different across keys', () => {
    expect(webhookSecretForKey('7')).toBe(webhookSecretForKey('7'));
    expect(webhookSecretForKey(7)).toBe(webhookSecretForKey('7'));
    expect(webhookSecretForKey('7')).not.toBe(webhookSecretForKey('8'));
  });

  it('does not leak the key id', () => {
    expect(webhookSecretForKey('7')).not.toContain('7:');
    expect(webhookSecretForKey('7')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('signWebhookBody / verifyWebhookSignature', () => {
  const secret = webhookSecretForKey('7');
  const body = JSON.stringify({ event: 'task.accepted', taskId: '902' });

  it('round-trips', () => {
    expect(verifyWebhookSignature(body, signWebhookBody(body, secret), secret)).toBe(true);
  });

  it('uses the sha256= prefix the docs promise', () => {
    expect(signWebhookBody(body, secret)).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('rejects a tampered body', () => {
    const sig = signWebhookBody(body, secret);
    expect(verifyWebhookSignature(body.replace('902', '903'), sig, secret)).toBe(false);
  });

  it('rejects the right body signed with another key’s secret', () => {
    const sig = signWebhookBody(body, webhookSecretForKey('8'));
    expect(verifyWebhookSignature(body, sig, secret)).toBe(false);
  });

  it('rejects a missing or malformed header without throwing', () => {
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
    expect(verifyWebhookSignature(body, '', secret)).toBe(false);
    expect(verifyWebhookSignature(body, 'sha256=short', secret)).toBe(false);
  });
});

describe('eventForAction', () => {
  it('maps creation', () => {
    expect(eventForAction('createTask', {})).toBe('task.created');
  });

  it('ignores actions that are not task writes', () => {
    expect(eventForAction('createSale', { naasa: true })).toBeNull();
  });

  it('ignores an update that changed nothing worth reporting', () => {
    expect(eventForAction('updateTask', { id: '1', projectId: '12' })).toBeNull();
  });

  it('ranks done above accepted above assigned above progress', () => {
    const all = { naasa: true, myIshur: true, uid: ['45'], status: 50 };
    expect(eventForAction('updateTask', all)).toBe('task.done');
    expect(eventForAction('updateTask', { ...all, naasa: false })).toBe('task.accepted');
    expect(eventForAction('updateTask', { ...all, naasa: false, myIshur: false })).toBe('task.assigned');
    expect(eventForAction('updateTask', { status: 50 })).toBe('task.progress');
  });

  it('treats an emptied assignment as not an assignment', () => {
    expect(eventForAction('updateTask', { uid: [] })).toBeNull();
  });

  it('reports progress reset to 0 — falsy but a real change', () => {
    expect(eventForAction('updateTask', { status: 0 })).toBe('task.progress');
  });
});

describe('wants', () => {
  const target = (events: any[]) => ({ keyId: '7', name: null, url: 'https://x', events });

  it('an empty subscription means every event', () => {
    expect(wants(target([]), 'task.done')).toBe(true);
  });

  it('honours an explicit subscription', () => {
    expect(wants(target(['task.done']), 'task.done')).toBe(true);
    expect(wants(target(['task.done']), 'task.created')).toBe(false);
  });
});
