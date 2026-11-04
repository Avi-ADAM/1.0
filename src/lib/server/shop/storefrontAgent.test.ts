/**
 * The storefront agent against fake deps: a rikma product's terms become a
 * proposal (never approved here), a personal product applies at once, pictures
 * are operational, a batch answers each item and survives a failing one.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  createProduct,
  eachItem,
  proposeProductEdit,
  setProductImages,
  upsertProductVariants,
  type StorefrontDeps
} from './storefrontAgent';

function productNode(id: string, opts: { origin?: string; members?: number; variants?: any[] } = {}) {
  return {
    id,
    attributes: {
      name: 'Mug',
      price: 40,
      pricingMode: 'fixed',
      origin: opts.origin ?? 'project',
      archived: false,
      desc: '',
      kindOf: 'total',
      pic: { data: { id: '300', attributes: { url: 'https://cdn/c.jpg' } } },
      pics: { data: [] },
      options: { data: [{ id: '1', attributes: { key: 'size', name: 'Size', values: [{ value: 'm', label: 'M' }] } }] },
      variants: { data: opts.variants ?? [] },
      archive_decisions: { data: [] },
      projectcreates: { data: [{ id: '89', attributes: { user_1s: { data: Array.from({ length: opts.members ?? 3 }, (_, i) => ({ id: String(i + 1) })) } } }] }
    }
  };
}

function fakeDeps(opts: { node?: any; act?: (key: string, params: any) => any; images?: string[] } = {}) {
  const calls: Array<{ key: string; params: any }> = [];
  const deps: StorefrontDeps = {
    run: vi.fn(async (qid: string, vars: any) => {
      if (qid === 'shopEditorProduct') return { matanots: { data: opts.node === null ? [] : [opts.node ?? productNode(vars.id)] } };
      if (qid === 'shopEditorRikmaOptions')
        return { productOptions: { data: [{ id: '1', attributes: { key: 'size', name: 'Size', values: [{ value: 's', label: 'S' }, { value: 'm', label: 'M' }] } }] } };
      if (qid === 'mediaUploadsByIds')
        return { uploadFiles: { data: (opts.images ?? vars.ids).map((id: string) => ({ id, attributes: { mime: 'image/jpeg' } })) } };
      throw new Error(`unexpected ${qid}`);
    }),
    act: vi.fn(async (key: string, params: any) => {
      calls.push({ key, params });
      return opts.act ? opts.act(key, params) : { ok: true, data: {} };
    })
  };
  return { deps, calls };
}

describe('proposeProductEdit', () => {
  it('a rikma product: the terms go to the partners as a proposal with its clock and vote link', async () => {
    const { deps, calls } = fakeDeps({
      act: () => ({ ok: true, data: { proposal: { decisionId: '900', deadline: '2026-11-06T10:00:00.000Z', immediate: false }, proposed: 2 } })
    });
    const res: any = await proposeProductEdit(deps, '89', { productId: '5', name: 'Big mug', price: 55, reason: 'bigger' });
    expect(calls[0]).toEqual({
      key: 'saveProductVariants',
      params: { projectId: '89', productId: '5', why: 'bigger', details: { name: 'Big mug' }, basePrice: 55 }
    });
    expect(res).toMatchObject({
      success: true,
      applied: 'proposal',
      mode: 'consent',
      proposalId: '900',
      silenceApprovesAt: '2026-11-06T10:00:00.000Z',
      voteUrl: 'https://www.1lev1.com/moach/89/votes/decision/900'
    });
    // Nothing here votes.
    expect(calls.some((c) => /vote/i.test(c.key))).toBe(false);
  });

  it('a personal product applies at once', async () => {
    const { deps } = fakeDeps({ node: productNode('5', { origin: 'personal' }), act: () => ({ ok: true, data: { proposal: null } }) });
    const res: any = await proposeProductEdit(deps, '89', { productId: '5', descrip: 'new' });
    expect(res).toMatchObject({ success: true, applied: 'direct', mode: 'direct', proposalId: null });
  });

  it('an open proposal is said, with the link to answer it', async () => {
    const { deps } = fakeDeps({ act: () => ({ ok: true, data: { blocked: 'OPEN_PROPOSAL', openDecisionId: '700' } }) });
    const res: any = await proposeProductEdit(deps, '89', { productId: '5', price: 1 });
    expect(res.blocked).toBe('OPEN_PROPOSAL');
    expect(res.voteUrl).toMatch(/decision\/700$/);
  });

  it('a product of another rikma is not found, and nothing is written', async () => {
    const { deps, calls } = fakeDeps({ node: null });
    const res: any = await proposeProductEdit(deps, '89', { productId: '5', name: 'x' });
    expect(res).toMatchObject({ success: false, code: 'PRODUCT_NOT_FOUND' });
    expect(calls).toHaveLength(0);
  });

  it('nothing to change is refused before any read', async () => {
    const { deps } = fakeDeps();
    expect((await proposeProductEdit(deps, '89', { productId: '5' })).success).toBe(false);
    expect(deps.run).not.toHaveBeenCalled();
  });

  it('a refused pricing mode explains what to do instead', async () => {
    const { deps } = fakeDeps({ act: () => ({ ok: false, code: 'PRICING_MODE_IS_TERM', message: 'do it from the product page in the moach' }) });
    const res: any = await proposeProductEdit(deps, '89', { productId: '5', pricingMode: 'quote' });
    expect(res).toMatchObject({ success: false, code: 'PRICING_MODE_IS_TERM' });
    expect(res.message).toMatch(/moach/);
  });
});

describe('setProductImages', () => {
  it('cover first, then the gallery — operational, one save', async () => {
    const { deps, calls } = fakeDeps({ act: () => ({ ok: true, data: { proposal: null } }) });
    const res: any = await setProductImages(deps, '89', { productId: '5', coverId: '11', galleryIds: ['12', '11', '13'] });
    expect(calls[0].params.gallery).toEqual(['11', '12', '13']);
    expect(res).toMatchObject({ success: true, applied: 'direct' });
  });
  it('refuses ids that are not pictures, before writing', async () => {
    const { deps, calls } = fakeDeps({ images: ['11'] });
    const res: any = await setProductImages(deps, '89', { productId: '5', coverId: '11', galleryIds: ['99'] });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/99/);
    expect(calls).toHaveLength(0);
  });
});

describe('upsertProductVariants', () => {
  it('a bad option value is answered per item, nothing is written', async () => {
    const { deps, calls } = fakeDeps();
    const res: any = await upsertProductVariants(deps, '89', '5', [{ optionValues: { size: 'XL' } }]);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/variants\[0\]/);
    expect(calls).toHaveLength(0);
  });
});

describe('createProduct', () => {
  it('creates, then saves gallery, categories and variants on the new product', async () => {
    const { deps, calls } = fakeDeps({
      act: (key) =>
        key === 'createPersonalMatanot'
          ? { ok: true, data: { matanotId: '5' } }
          : { ok: true, data: { proposal: { decisionId: '901', deadline: 'later', immediate: false }, proposed: 1 } }
    });
    const res: any = await createProduct(deps, '89', {
      name: 'Tee',
      price: 80,
      picId: '11',
      galleryIds: ['12'],
      categories: ['3'],
      variants: [{ optionValues: { size: 'S' }, quant: 4 }]
    });
    expect(calls.map((c) => c.key)).toEqual(['createPersonalMatanot', 'saveProductVariants']);
    expect(calls[0].params).toMatchObject({ projectId: '89', picId: '11', pricingMode: 'fixed' });
    expect(calls[1].params).toMatchObject({ gallery: ['11', '12'], categories: ['3'] });
    expect(res).toMatchObject({ success: true, productId: '5', applied: 'proposal', proposalId: '901' });
  });
  it('a failed create is a failure; a failed extra keeps the product and says what is missing', async () => {
    const failed = fakeDeps({ act: () => ({ ok: false, message: 'Only rikma members' }) });
    expect(await createProduct(failed.deps, '89', { name: 'x', price: 1 })).toMatchObject({ success: false });

    const partial = fakeDeps({
      act: (key) => (key === 'createPersonalMatanot' ? { ok: true, data: { matanotId: '5' } } : { ok: false, code: 'INVALID_CATEGORIES', message: 'Unknown categories: 9' })
    });
    const res: any = await createProduct(partial.deps, '89', { name: 'x', price: 1, categories: ['9'] });
    expect(res).toMatchObject({ success: true, partial: true, productId: '5' });
    expect(res.message).toMatch(/Unknown categories/);
  });
});

describe('eachItem (batches)', () => {
  it('one failing item — by result or by throw — never stops the rest', async () => {
    const out = await eachItem([1, 2, 3], async (n) => {
      if (n === 2) throw new Error('boom');
      return { success: n !== 3, n };
    });
    expect(out.results.map((r) => [r.index, r.success])).toEqual([
      [0, true],
      [1, false],
      [2, false]
    ]);
    expect(out).toMatchObject({ succeeded: 1, failed: 2 });
  });
});
