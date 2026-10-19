import { describe, expect, it } from 'vitest';
import { starterDeployUrl, starterNetlifyUrl } from './starter';

const vercelEnv = (url: string) => {
  const p = new URL(url).searchParams;
  return { keys: (p.get('env') ?? '').split(','), values: JSON.parse(p.get('envDefaults') ?? '{}') };
};

describe('starter deploy links', () => {
  it('asks only for the keys of the chosen ways to pay', () => {
    const { keys } = vercelEnv(starterDeployUrl({ providers: ['paypal'] }));
    expect(keys).toContain('PAYPAL_CLIENT_ID');
    expect(keys).not.toContain('STRIPE_SECRET_KEY');
    expect(keys).not.toContain('ARRANGED_PAYMENT');
  });

  it('payment by arrangement alone needs no provider keys and turns the mode on', () => {
    const { keys, values } = vercelEnv(starterDeployUrl({ providers: ['arranged'] }));
    expect(keys).toEqual(['LEV_RIKMA_URL', 'LEV_ORDERS_KEY', 'ARRANGED_PAYMENT', 'SHOP_WHATSAPP']);
    expect(values.ARRANGED_PAYMENT).toBe('phone,whatsapp');
    expect(values.SHOP_WHATSAPP).toBeUndefined();
  });

  it('mixes arrangement with a provider, on Netlify too', () => {
    const hash = new URL(starterNetlifyUrl({ providers: ['stripe', 'arranged'] })).hash;
    expect(hash).toContain('STRIPE_SECRET_KEY=');
    expect(hash).toContain(`ARRANGED_PAYMENT=${encodeURIComponent('phone,whatsapp')}`);
    expect(hash).toContain('SHOP_WHATSAPP=');
  });
});
