import { describe, expect, it, vi } from 'vitest';

const sent: Array<{ url: string; body: string; event: string }> = [];
vi.mock('./targets.js', () => ({
  getWebhookTargets: async () => [
    { keyId: '1', name: 'store', url: 'https://shop.example/hook', events: [], scopes: ['products:read'] },
    { keyId: '2', name: 'desk', url: 'https://desk.example/hook', events: [], scopes: ['tasks:write'] },
    { keyId: '3', name: 'till', url: 'https://till.example/hook', events: ['order.paid'], scopes: ['orders:create'] }
  ],
  wants: (t: any, e: string) => t.events.length === 0 || t.events.includes(e)
}));
vi.mock('./dispatch.js', () => ({
  deliver: async (t: any, body: string, event: string) => void sent.push({ url: t.url, body, event })
}));

const { deliverPromotionChange, promotionEventOf, mayReceivePromotion, promotionWebhookBody } = await import('./promotionEvents.js');

describe('promotion webhooks', () => {
  it('maps a status write to the event a storefront cares about', () => {
    expect(promotionEventOf('active')).toBe('promotion.started');
    expect(promotionEventOf('paused')).toBe('promotion.paused');
    expect(promotionEventOf('ended')).toBe('promotion.ended');
    expect(promotionEventOf('proposed')).toBeNull();
    expect(promotionEventOf('scheduled')).toBeNull();
  });

  it('goes to a catalog or orders key, never to a task desk', () => {
    expect(mayReceivePromotion(['products:read'])).toBe(true);
    expect(mayReceivePromotion(['orders:read'])).toBe(true);
    expect(mayReceivePromotion(['tasks:write'])).toBe(false);
  });

  it('a small body — the nudge to refetch, not a copy of the catalog', () => {
    const body = JSON.parse(promotionWebhookBody('promotion.ended', { projectId: '57', promotionId: '9', status: 'ended', endedReason: 'cap' }, 'T'));
    expect(body).toEqual({ event: 'promotion.ended', at: 'T', projectId: '57', data: { id: '9', status: 'ended', endedReason: 'cap' } });
  });

  it('delivers to the targets that want it', async () => {
    sent.length = 0;
    await deliverPromotionChange({ projectId: '57', promotionId: '9', status: 'active' }, { strapi: {} as any, fetch: globalThis.fetch });
    expect(sent.map((s) => [s.url, s.event])).toEqual([['https://shop.example/hook', 'promotion.started']]);
  });
});
