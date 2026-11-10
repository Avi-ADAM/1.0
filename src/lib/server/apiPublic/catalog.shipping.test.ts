import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/actions/index.js', () => ({ strapiClient: {} }));

import { fetchCategories } from './catalog';
import { resetShippingSchemaVerdict } from '$lib/server/shop/shippingConfig.js';

const shipping = {
  enabled: true,
  zones: [{ id: 'center', name: 'מרכז', cities: [], methods: [{ id: 'courier', name: 'שליח', fee: 30, productId: '9' }] }]
};

function runner(answer: () => unknown) {
  const sent: any[] = [];
  const run = vi.fn(async (qid: string, vars: any) => {
    if (qid === 'rikmaApiShippingSchema') return { data: { projects: { data: [] }, orders: { data: [] } } };
    if (qid === 'shippingConfigGet') return answer();
    if (qid === 'rikmaApiCategories') sent.push(vars.filters);
    return { data: { matanots: { data: [] } } };
  });
  return { run: run as any, sent };
}
const keepsOut = (filters: any) => filters.and.some((f: any) => f?.id?.notIn?.includes('9'));

describe('the shop lists no delivery-fee product', () => {
  it('filters the linked product out for a visitor', async () => {
    resetShippingSchemaVerdict();
    const { run, sent } = runner(() => ({ data: { project: { data: { attributes: { shipping } } } } }));
    await fetchCategories(run, { projectId: '701', access: { level: 'anonymous' } });
    expect(keepsOut(sent[0])).toBe(true);
  });

  it("leaves it visible to the rikma's own draft key", async () => {
    resetShippingSchemaVerdict();
    const { run, sent } = runner(() => ({ data: { project: { data: { attributes: { shipping } } } } }));
    await fetchCategories(run, { projectId: '702', access: { level: 'draft' } });
    expect(keepsOut(sent[0])).toBe(false);
  });

  it('unreadable settings leave the list as it was', async () => {
    resetShippingSchemaVerdict();
    const { run, sent } = runner(() => {
      throw new Error('strapi down');
    });
    await fetchCategories(run, { projectId: '703', access: { level: 'anonymous' } });
    expect(sent).toHaveLength(1);
    expect(keepsOut(sent[0])).toBe(false);
  });
});
