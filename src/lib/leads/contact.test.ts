import { describe, expect, it } from 'vitest';
import { acceptedChoice, offerText, preferredChannel, reachableChannels, siteMessageOf, whatsappWithText } from './contact';
import { validateOrderPayload } from '$lib/server/ordersApi';

const reach = (over: Partial<{ phone: string | null; email: string | null; customerUserId: string | null }> = {}) => ({
  phone: null,
  email: null,
  customerUserId: null,
  ...over
});

describe('contact channels', () => {
  it('only the channels there is a way to use', () => {
    expect(reachableChannels(reach({ email: 'a@b.co' }))).toEqual(['email']);
    expect(reachableChannels(reach({ phone: '050', customerUserId: '4' }))).toEqual(['site', 'phone', 'whatsapp']);
  });

  it('their choice first when it can be used; never a reach they did not give', () => {
    expect(preferredChannel('whatsapp', reach({ phone: '050', email: 'a@b.co' }))).toBe('whatsapp');
    expect(preferredChannel('whatsapp', reach({ email: 'a@b.co' }))).toBe('email');
    expect(preferredChannel(null, reach())).toBeNull();
    expect(acceptedChoice('site', reach({ email: 'a@b.co' }))).toBeNull();
    expect(acceptedChoice('email', reach({ email: 'a@b.co' }))).toBe('email');
  });

  it('the offer reads the same on every channel', () => {
    const text = offerText(
      { lines: [{ name: 'Mug · blue', quantity: 2, unitPrice: 40 }], total: 80, note: 'by Thursday' },
      { greeting: 'Hello Dana', total: 'Total', closing: 'Thanks' },
      (n) => `₪${n}`
    );
    expect(text).toBe('Hello Dana\n\n• Mug · blue — 2 × ₪40\n\nTotal: ₪80\n\nby Thursday\n\nThanks');
    expect(whatsappWithText('https://wa.me/972501', 'a b')).toBe('https://wa.me/972501?text=a%20b');
    expect(siteMessageOf('site:hi')).toBe('hi');
    expect(siteMessageOf('hi')).toBeNull();
  });
});

describe('arranged orders: how the buyer is reached', () => {
  const body = (buyer: Record<string, unknown>) => ({
    externalId: 'x1',
    payment: 'arranged',
    buyer: { name: 'Dana', ...buyer },
    lines: [{ productId: '1', quantity: 1, unitPrice: 10 }]
  });

  it("a storefront's arranged order still needs a phone (the public contract)", () => {
    expect(validateOrderPayload(body({ email: 'd@x.co' })).ok).toBe(false);
  });

  it('an offer to a lead needs any way — a phone, an email, or an account', () => {
    expect(validateOrderPayload(body({ email: 'd@x.co' }), { arrangedReach: 'any' }).ok).toBe(true);
    expect(validateOrderPayload(body({}), { arrangedReach: 'any', hasAccount: true }).ok).toBe(true);
    expect(validateOrderPayload(body({}), { arrangedReach: 'any' }).ok).toBe(false);
  });
});
