import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readable } from 'svelte/store';

/**
 * One form, two lives: an existing product opens as stored and saves only what
 * moved; a new one writes its staged variants once it has an id.
 */

const executeAction = vi.fn(async (..._args: unknown[]) => ({ success: true, data: { proposed: 0 } as Record<string, unknown> }));

vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), goto: vi.fn(), invalidate: vi.fn(async () => {}) }));
vi.mock('$lib/translations', () => ({
  t: readable((key: string, vars?: Record<string, unknown>) => (vars ? `${key} ${JSON.stringify(vars)}` : key)),
  isRtl: readable(true),
  locale: readable('he')
}));
vi.mock('svelte-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), message: vi.fn() } }));
vi.mock('$lib/client/actionClient', () => ({ executeAction: (...a: unknown[]) => executeAction(...a) }));
vi.mock('$lib/money/context.svelte', () => ({
  useMoney: () => ({ currency: 'ILS' }),
  useRikmaCurrency: () => () => 'ILS',
  useFormatMoney: () => (n: number) => `₪${n}`
}));
vi.mock('$lib/celim/ui/richText.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/userPr/uploadPic.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/location/LocationPicker.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/money/CurrencyPicker.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/money/Money.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/archive/ArchiveObjectButton.svelte', () => ({ default: () => {} }));
vi.mock('./MissionPickerList.svelte', () => ({ default: () => {} }));
vi.mock('./ResourcePickerList.svelte', () => ({ default: () => {} }));

const ProductForm = (await import('./ProductForm.svelte')).default;

const stored = {
  id: '10',
  name: 'סדנה',
  price: 280,
  pricingMode: 'fixed',
  quant: 5,
  descrip: '',
  kindOf: 'total',
  startDate: null,
  endDate: null,
  origin: 'project',
  sovereign: false,
  members: 2,
  archived: false,
  gallery: [],
  axes: [],
  variants: [],
  lowStockAt: null,
  openDecisionId: null,
  pending: null,
  unlimited: false,
  oneForeProject: false,
  marginPct: 0,
  location: null,
  recipe: [],
  recipeLocked: false,
  recipeIsDeal: false
};

const costed = {
  pricingMode: 'estimated',
  price: 300,
  recipe: [
    { id: 'm1', kind: 'mission', name: 'עיצוב', amount: 2, units: 1, unit: 100, cost: 200, open: true, linkedId: null },
    { id: 'r5', kind: 'resource', name: 'בד', amount: 2, units: 1, unit: 50, cost: 100, open: false, linkedId: null }
  ]
};

const saveButton = (root: HTMLElement, key: string) =>
  [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(key)) as HTMLButtonElement;

async function openEdit(over: Record<string, unknown> = {}) {
  const view = render(ProductForm as any, { props: { projectId: '57', product: { ...stored, ...over } } });
  await tick();
  return view;
}

const lastSave = () => executeAction.mock.calls.at(-1)?.[1] as Record<string, unknown>;

beforeEach(() => {
  executeAction.mockClear();
  // happy-dom rejects a cancelled animation, and the save button's transitions end with the test.
  Element.prototype.animate = vi.fn(() => ({ cancel() {}, finish() {}, onfinish: null, currentTime: 0 })) as any;
});

describe('ProductForm — an existing product', () => {
  it('opens with what is stored and has nothing to save', async () => {
    const { container } = await openEdit();
    expect((container.querySelector('#pf-name') as HTMLInputElement).value).toBe('סדנה');
    expect((container.querySelector('#pf-base') as HTMLInputElement).value).toBe('280');
    expect((container.querySelector('#pf-quant') as HTMLInputElement).value).toBe('5');
    expect(saveButton(container, 'shopEditor.save').disabled).toBe(true);
  });

  it('a moved price is offered to the partners, and nothing else is sent as changed', async () => {
    const { container } = await openEdit();
    await fireEvent.input(container.querySelector('#pf-base')!, { target: { value: '300' } });
    await tick();
    expect(container.textContent).toContain('shopEditor.propose.title');
    await fireEvent.click(saveButton(container, 'shopEditor.saveAndPropose'));
    await tick();
    expect(executeAction.mock.calls[0][0]).toBe('saveProductVariants');
    expect(lastSave()).toMatchObject({ projectId: '57', productId: '10', basePrice: 300 });
    expect(lastSave()).not.toHaveProperty('stock');
    expect(lastSave()).not.toHaveProperty('location');
    expect(lastSave()).not.toHaveProperty('details');
  });

  it('a moved count saves at once, without a proposal', async () => {
    const { container } = await openEdit();
    await fireEvent.input(container.querySelector('#pf-quant')!, { target: { value: '9' } });
    await tick();
    expect(container.textContent).not.toContain('shopEditor.propose.title');
    await fireEvent.click(saveButton(container, 'shopEditor.save'));
    await tick();
    expect(lastSave()).toMatchObject({ stock: { quant: 9, unlimited: false } });
    expect(lastSave()).not.toHaveProperty('basePrice');
  });

  it('a product made of missions opens with nothing to save, and keeps its price editable', async () => {
    const { container } = await openEdit({ ...costed, marginPct: 20 });
    expect(container.textContent).toContain('עיצוב');
    expect(container.textContent).toContain('shopEditor.form.marginNote');
    expect(container.querySelector('#pf-base')).not.toBeNull();
    expect(saveButton(container, 'shopEditor.save').disabled).toBe(true);
  });

  it('a moved line goes to the partners, and the price follows the recipe', async () => {
    const { container } = await openEdit(costed);
    await fireEvent.input(container.querySelector('#pf-unit-m1')!, { target: { value: '150' } });
    await tick();
    expect(container.textContent).toContain('shopEditor.propose.title');
    expect(container.textContent).toContain('shopEditor.pending.bomChange');
    expect((container.querySelector('#pf-base') as HTMLInputElement).value).toBe('400');
    await fireEvent.click(saveButton(container, 'shopEditor.saveAndPropose'));
    await tick();
    expect(lastSave()).toMatchObject({ basePrice: 400 });
    expect((lastSave() as any).bom.lines[0]).toMatchObject({ id: 'm1', unit: 150, removed: false });
  });

  it('a price the seller typed stays theirs when the recipe moves', async () => {
    const { container } = await openEdit(costed);
    await fireEvent.input(container.querySelector('#pf-base')!, { target: { value: '350' } });
    await fireEvent.input(container.querySelector('#pf-unit-m1')!, { target: { value: '150' } });
    await tick();
    expect((container.querySelector('#pf-base') as HTMLInputElement).value).toBe('350');
  });

  it('removing a line can be undone, and undoing it leaves nothing to save', async () => {
    const { container } = await openEdit(costed);
    await fireEvent.click(saveButton(container, 'shopEditor.form.bomRemove'));
    await tick();
    expect(container.textContent).toContain('shopEditor.pending.bomRemove');
    await fireEvent.click(saveButton(container, 'shopEditor.form.bomRestore'));
    await tick();
    expect(container.textContent).not.toContain('shopEditor.propose.title');
    expect(saveButton(container, 'shopEditor.save').disabled).toBe(true);
  });

  it('removing every line is refused before anything is sent', async () => {
    const { container } = await openEdit(costed);
    for (const _ of costed.recipe) {
      await fireEvent.click(saveButton(container, 'shopEditor.form.bomRemove'));
      await tick();
    }
    await fireEvent.click(saveButton(container, 'shopEditor.saveAndPropose'));
    await tick();
    expect(executeAction).not.toHaveBeenCalled();
  });

  it('a wish product can change, says its customer signs, and proposes even alone', async () => {
    const { container } = await openEdit({ ...costed, recipeIsDeal: true, origin: 'wish', sovereign: true });
    expect(container.textContent).toContain('shopEditor.form.bomDealHint');
    await fireEvent.input(container.querySelector('#pf-unit-m1')!, { target: { value: '150' } });
    await tick();
    expect(container.textContent).toContain('shopEditor.propose.title');
  });

  it('a recipe that could not be read is shown and cannot change', async () => {
    const { container } = await openEdit({ ...costed, recipeLocked: true });
    expect(container.textContent).toContain('עיצוב');
    expect(container.textContent).toContain('shopEditor.form.bomUnread');
    expect(container.querySelector('#pf-unit-m1')).toBeNull();
    expect(saveButton(container, 'shopEditor.form.bomRemove')).toBeUndefined();
  });

  it('a reload after the save starts clean from what is stored', async () => {
    const view = await openEdit();
    await fireEvent.input(view.container.querySelector('#pf-quant')!, { target: { value: '9' } });
    await tick();
    await view.rerender({ product: { ...stored, quant: 9 } });
    await tick();
    expect((view.container.querySelector('#pf-quant') as HTMLInputElement).value).toBe('9');
    expect(saveButton(view.container, 'shopEditor.save').disabled).toBe(true);
  });
});

describe('ProductForm — a new product', () => {
  it('writes options the seller named with the new id, on the real SKU', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: { matanot: { id: '42' }, matanotId: '42' } })
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(ProductForm as any, {
      props: { projectId: '57', initialPricing: 'fixed', rikmaAxes: [] }
    });
    await tick();
    await fireEvent.input(container.querySelector('#pf-name')!, { target: { value: 'חולצה' } });
    await fireEvent.input(container.querySelector('#pf-price')!, { target: { value: '50' } });

    const rows = [...container.querySelectorAll('button[aria-expanded]')];
    const variantsRow = rows.find((b) => b.textContent?.includes('shopEditor.form.variants')) as HTMLButtonElement;
    await fireEvent.click(variantsRow);
    await tick();
    await fireEvent.click(saveButton(container, 'shopEditor.options.add'));
    await tick();
    await fireEvent.input(container.querySelector('.vf-axis-name input')!, { target: { value: 'מידה' } });
    await fireEvent.input(container.querySelector('.vf-value-input')!, { target: { value: 'M' } });
    await fireEvent.submit(container.querySelector('.vf-value-add')!);
    await tick();

    // The seller never pressed "generate": saving still means those variants.
    await fireEvent.click(saveButton(container, 'shopEditor.form.save'));
    await vi.waitFor(() => expect(executeAction).toHaveBeenCalled());

    const save = lastSave() as any;
    expect(save.productId).toBe('42');
    expect(save.variants).toHaveLength(1);
    expect(save.variants[0].sku).toBe('P42-M');
    vi.unstubAllGlobals();
  });
});
