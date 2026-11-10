import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveShippingConfigConfig } from './shipping.js';
import { readShippingConfig } from '$lib/server/shop/shippingConfig.js';

vi.mock('$lib/server/shop/shippingConfig.js', () => ({ readShippingConfig: vi.fn() }));

const handler = saveShippingConfigConfig.graphqlOperation as (
  params: Record<string, any>,
  context: any,
  util: any
) => Promise<any>;

const context = { userId: '7', jwt: 'jwt', fetch: (() => {}) as any };

const linked = (methodProduct: string | null, pickupProduct: string | null = null) => ({
  enabled: true,
  zones: [{ id: 'center', name: 'מרכז', cities: ['רמת גן'], methods: [{ id: 'courier', name: 'שליח', fee: 30, productId: methodProduct }] }],
  pickupPoints: [{ id: 'studio', name: 'סטודיו', productId: pickupProduct }]
});

const product = (projectIds: string[], hideFromDiscovery: boolean | null = null) => ({
  data: { matanot: { data: { id: 'x', attributes: { hideFromDiscovery, projectcreates: { data: projectIds.map((id) => ({ id })) } } } } }
});

function strapiWith(products: Record<string, unknown>) {
  const execute = vi.fn(async (qid: string, vars: Record<string, any>) => {
    if (qid === '266getMatanotSellerMeta') {
      const found = products[vars.id];
      if (found instanceof Error) throw found;
      return found ?? { data: { matanot: { data: null } } };
    }
    return { data: {} };
  });
  return { execute };
}

const hidden = (strapi: ReturnType<typeof strapiWith>) =>
  strapi.execute.mock.calls.filter(([qid]) => qid === '285setMatanotDiscovery').map(([, vars]) => vars);

const save = (config: unknown, strapi: ReturnType<typeof strapiWith>) =>
  handler({ projectId: '87', config }, context, { strapi });

describe('saveShippingConfig hides the products that carry a delivery fee', () => {
  beforeEach(() => {
    vi.mocked(readShippingConfig).mockResolvedValue({ live: true } as any);
  });

  it('hides a product linked to a method and one linked to a pickup point', async () => {
    const strapi = strapiWith({ 9: product(['87']), 10: product(['87'], false) });
    await save(linked('9', '10'), strapi);
    expect(hidden(strapi)).toEqual([
      { id: '9', hideFromDiscovery: true },
      { id: '10', hideFromDiscovery: true }
    ]);
  });

  it('writes the settings before touching any product', async () => {
    const strapi = strapiWith({ 9: product(['87']) });
    await save(linked('9'), strapi);
    const order = strapi.execute.mock.calls.map(([qid]) => qid);
    expect(order.indexOf('shippingConfigSet')).toBeLessThan(order.indexOf('285setMatanotDiscovery'));
  });

  it("never touches another rikma's product", async () => {
    const strapi = strapiWith({ 9: product(['12']) });
    await save(linked('9'), strapi);
    expect(hidden(strapi)).toEqual([]);
  });

  it('asks once for a product linked to several options', async () => {
    const strapi = strapiWith({ 9: product(['87']) });
    await save(linked('9', '9'), strapi);
    expect(hidden(strapi)).toHaveLength(1);
  });

  it('writes nothing for a product that is already hidden', async () => {
    const strapi = strapiWith({ 9: product(['87'], true) });
    await save(linked('9'), strapi);
    expect(hidden(strapi)).toEqual([]);
  });

  it('leaves everything alone when nothing is linked', async () => {
    const strapi = strapiWith({});
    await save(linked(null), strapi);
    expect(strapi.execute.mock.calls.map(([qid]) => qid)).toEqual(['shippingConfigSet']);
  });

  it('still saves, and still hides the rest, when one product cannot be read', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const strapi = strapiWith({ 9: new Error('strapi down'), 10: product(['87']) });
    const out = await save(linked('9', '10'), strapi);
    expect(out.config.zones).toHaveLength(1);
    expect(hidden(strapi)).toEqual([{ id: '10', hideFromDiscovery: true }]);
    expect(quiet).toHaveBeenCalledOnce();
    quiet.mockRestore();
  });
});
