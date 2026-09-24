/**
 * The review screen is where a drafted rikma becomes real, so what it SENDS is
 * the contract: only ticked rows, the owner's inline fixes as ops, and the
 * version it was showing. Nothing is created before the click.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { readable } from 'svelte/store';

vi.mock('$lib/translations', () => ({
  t: readable((key: string, payload?: Record<string, unknown>) =>
    payload ? `${key}:${Object.values(payload).join(',')}` : key
  )
}));

const executeAction = vi.fn();
vi.mock('$lib/client/actionClient', () => ({
  executeAction: (...args: unknown[]) => executeAction(...args)
}));

import BlueprintReview from './BlueprintReview.svelte';

const session = {
  sessionId: '42',
  version: 3,
  projectId: null,
  projectName: null,
  fields: { track: 'business', name: 'השקד', currency: 'ILS' },
  items: [
    { key: 'i1', group: 'products', label: 'סדנה', status: 'proposed', spec: { price: 180, keywords: ['אפייה'], recipe: { missionKeys: ['i3'], resourceKeys: [] } } },
    { key: 'i2', group: 'products', label: 'מגש', status: 'dropped' },
    { key: 'i3', group: 'rikmaMissions', label: 'הנחיה', status: 'proposed', spec: { holder: 'me' } },
    { key: 'i4', group: 'rikmaResources', label: 'תנור', status: 'applied', createdRef: { type: 'openMashaabim', id: '9' } }
  ]
};

beforeEach(() => executeAction.mockReset());

describe('BlueprintReview', () => {
  it('shows products first, ticks open rows, leaves "not now" and created rows unticked', () => {
    const { getAllByRole, getByText } = render(BlueprintReview, { props: { session } });
    // The shared Button renders its label in an <h2>; only section headings count.
    const headings = getAllByRole('heading', { level: 2 })
      .filter((h) => !h.closest('button'))
      .map((h) => h.textContent);
    expect(headings).toEqual(['rikmaImport.groups.products', 'rikmaImport.groups.rikmaMissions', 'rikmaImport.groups.rikmaResources']);

    const boxes = getAllByRole('checkbox') as HTMLInputElement[];
    expect(boxes.map((b) => [b.getAttribute('aria-label'), b.checked, b.disabled])).toEqual([
      ['סדנה', true, false],
      ['מגש', false, false],
      ['הנחיה', true, false],
      ['תנור', true, true]
    ]);
    // A recipe row says it rides inside its product.
    expect(getByText('rikmaImport.row.partOf:סדנה')).toBeTruthy();
    expect(getByText('rikmaImport.selectedCount:2')).toBeTruthy();
  });

  it('creates only the ticked rows and sends inline fixes as ops', async () => {
    executeAction.mockResolvedValue({ success: true, data: { created: [{ key: 'i1' }], failed: [], invites: [], projectId: '77', proposals: { boards: 1 } } });
    const { getAllByRole, getAllByLabelText, getByDisplayValue, findByText, getByRole } = render(BlueprintReview, { props: { session } });

    await fireEvent.input(getAllByLabelText('rikmaImport.row.name')[0], { target: { value: 'סדנת אפייה' } });
    await fireEvent.input(getByDisplayValue('180'), { target: { value: '200' } });
    await fireEvent.input(getByDisplayValue('אפייה'), { target: { value: 'אפייה, סדנה, baking' } });
    // Untick the mission: it will be kept as a proposal, not created.
    await fireEvent.click(getAllByRole('checkbox')[2]);

    await fireEvent.click(getByRole('button'));

    expect(executeAction).toHaveBeenCalledTimes(1);
    const [key, params] = executeAction.mock.calls[0];
    expect(key).toBe('materializeRikmaBlueprint');
    expect(params).toEqual({
      sessionId: '42',
      expectedVersion: 3,
      selectedKeys: ['i1'],
      ops: [
        { op: 'rename', key: 'i1', label: 'סדנת אפייה' },
        { op: 'setSpec', key: 'i1', spec: { price: 200, pricingMode: 'fixed', keywords: ['אפייה', 'סדנה', 'baking'] } }
      ],
      via: 'site'
    });
    expect(await findByText('rikmaImport.result.created:1')).toBeTruthy();
  });

  it('a conflict hands back to the page instead of showing a result', async () => {
    executeAction.mockResolvedValue({ success: true, data: { conflict: true } });
    const onConflict = vi.fn();
    const { getByRole, queryByText } = render(BlueprintReview, { props: { session, onConflict } });
    await fireEvent.click(getByRole('button'));
    expect(onConflict).toHaveBeenCalled();
    expect(queryByText('rikmaImport.result.title')).toBeNull();
  });

  it('an emptied price means "on request"', async () => {
    executeAction.mockResolvedValue({ success: true, data: { created: [], failed: [], invites: [] } });
    const { getByDisplayValue, getByRole } = render(BlueprintReview, { props: { session } });
    await fireEvent.input(getByDisplayValue('180'), { target: { value: '' } });
    await fireEvent.click(getByRole('button'));
    expect(executeAction.mock.calls[0][1].ops).toEqual([{ op: 'setSpec', key: 'i1', spec: { price: null, pricingMode: 'quote' } }]);
  });
});
