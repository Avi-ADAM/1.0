import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readable } from 'svelte/store';
import VariantsField from './VariantsField.svelte';
import { normaliseAxes } from '$lib/shop/variantEditor';

vi.mock('$lib/translations', () => ({ t: readable((key: string) => key) }));

const axis = (id: string, name: string) => ({
  optionId: id, key: 'הבקבוק-בטאצ', name,
  values: [{ value: 'same', label: 'First', hex: null }, { value: 'same', label: 'Second', hex: null }]
});
const row = (id: string) => ({
  id, axisKey: '|size:m|', optionValues: [], name: `Variant ${id}`, sku: id,
  price: null, compareAtPrice: null, unlimited: false, quant: 0, active: true, position: 0, picIds: [], pictures: []
});

describe('VariantsField with duplicate legacy data', () => {
  it('renders duplicate keys and reuses the selected option rather than the first matching key', async () => {
    const axes: ReturnType<typeof axis>[] = [];
    const { container } = render(VariantsField, { props: {
      axes, rows: [row('1'), row('2')], gallery: [], productId: '84', productPrice: null,
      sovereign: true, rikmaAxes: [axis('1', 'First option'), axis('2', 'Second option')],
      clean: normaliseAxes([]), issues: [{ index: 1, code: 'variantDuplicate' }],
      plan: { terms: [] } as any, money: String
    } });
    expect(container.textContent).toContain('Variant 1');
    expect(container.textContent).toContain('Variant 2');
    expect(container.textContent).toContain('shopEditor.err.variantDuplicate');
    const select = container.querySelector('select')!;
    expect(select.options).toHaveLength(3);
    await fireEvent.change(select, { target: { value: '1' } });
    await tick();
    expect(axes[0].optionId).toBe('2');
  });

  it('renders and removes duplicate values independently', async () => {
    const axes = [axis('1', 'Option')];
    const { container } = render(VariantsField, { props: {
      axes, rows: [], gallery: [], productId: '84', productPrice: null, sovereign: true,
      rikmaAxes: [], clean: normaliseAxes(axes), issues: [], plan: { terms: [] } as any, money: String
    } });
    const remove = container.querySelectorAll('.vf-value-x');
    expect(remove).toHaveLength(2);
    await fireEvent.click(remove[0]);
    expect(axes[0].values.map((v) => v.label)).toEqual(['Second']);
  });
});
