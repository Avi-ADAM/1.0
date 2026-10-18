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
  ),
  // The rich editor that shows a description reads it.
  isRtl: readable(true)
}));

// The editable description's formatting bubble pulls tippy.js, whose CJS build
// does not load under vitest; the bubble is not what these tests are about.
vi.mock('@tiptap/extension-bubble-menu', async () => {
  const { Extension } = await import('@tiptap/core');
  return { BubbleMenu: Extension.create({ name: 'bubbleMenu' }) };
});

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
    expect(headings).toEqual(['rikmaImport.field.heading', 'rikmaImport.groups.products', 'rikmaImport.groups.rikmaMissions', 'rikmaImport.groups.rikmaResources']);

    // The row boxes are the ones named after their row.
    const boxes = (getAllByRole('checkbox') as HTMLInputElement[]).filter((b) => b.hasAttribute('aria-label'));
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

  it('shows invitation delivery status and gives the owner a working copy-link fallback', async () => {
    executeAction.mockResolvedValue({
      success: true,
      data: {
        created: [],
        failed: [],
        invites: [{ key: 'p1', result: 'notRegistered', emailStatus: 'sent', joinUrl: 'https://www.1lev1.com/project/77/join' }],
        projectId: '77',
        proposals: { boards: 0 }
      }
    });
    const partnerSession = {
      ...session,
      items: [...session.items, { key: 'p1', group: 'partners', label: 'Dana', status: 'proposed', spec: { email: 'dana@example.com' } }]
    };
    const writeText = vi.fn().mockRejectedValueOnce(new Error('clipboard unavailable')).mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const { getByRole, getByText, findByText } = render(BlueprintReview, { props: { session: partnerSession } });

    await fireEvent.click(getByRole('button', { name: /rikmaImport\.submit/ }));
    expect(await findByText('rikmaImport.invite.notRegistered:Dana,1,0')).toBeTruthy();
    expect(getByText('https://www.1lev1.com/project/77/join')).toBeTruthy();

    await fireEvent.click(getByRole('button', { name: 'rikmaImport.invite.copy' }));
    expect(await findByText('rikmaImport.invite.copyFailed')).toBeTruthy();
    await fireEvent.click(getByRole('button', { name: 'rikmaImport.invite.copy' }));
    expect(writeText).toHaveBeenCalledWith('https://www.1lev1.com/project/77/join');
    expect(getByRole('button', { name: 'rikmaImport.invite.copied' })).toBeTruthy();
  });

  it('creates only the ticked rows and sends inline fixes as ops', async () => {
    executeAction.mockResolvedValue({ success: true, data: { created: [{ key: 'i1' }], failed: [], invites: [], projectId: '77', proposals: { boards: 1 } } });
    const { getAllByLabelText, getByDisplayValue, findByText, getByRole } = render(BlueprintReview, { props: { session } });

    await fireEvent.input(getAllByLabelText('rikmaImport.row.name')[0], { target: { value: 'סדנת אפייה' } });
    await fireEvent.input(getByDisplayValue('180'), { target: { value: '200' } });
    await fireEvent.input(getByDisplayValue('אפייה'), { target: { value: 'אפייה, סדנה, baking' } });
    // Untick the mission: it will be kept as a proposal, not created.
    await fireEvent.click(getByRole('checkbox', { name: 'הנחיה' }));

    await fireEvent.click(getByRole('button', { name: /rikmaImport.submit/ }));

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
    await fireEvent.click(getByRole('button', { name: /rikmaImport.submit/ }));
    expect(onConflict).toHaveBeenCalled();
    expect(queryByText('rikmaImport.result.title')).toBeNull();
  });

  it('a monthly price says it is per month, and a recurring mission says it recurs', () => {
    const monthly = {
      ...session,
      items: [
        { key: 'r', group: 'rikmaResources', label: 'שכירות', status: 'proposed', spec: { holder: 'me', kindOf: 'monthly', price: 6000 } },
        { key: 'x', group: 'rikmaResources', label: 'מקרר', status: 'proposed', spec: { kindOf: 'total', price: 3000 } },
        { key: 'm', group: 'rikmaMissions', label: 'משמרות', status: 'proposed', spec: { holder: 'open', recurring: true } }
      ]
    };
    const { getAllByText, getByText } = render(BlueprintReview, { props: { session: monthly } });
    expect(getAllByText('rikmaImport.row.period.monthly')).toHaveLength(1);
    expect(getByText('rikmaImport.row.recurring')).toBeTruthy();
  });

  it('an emptied price means "on request"', async () => {
    executeAction.mockResolvedValue({ success: true, data: { created: [], failed: [], invites: [] } });
    const { getByDisplayValue, getByRole } = render(BlueprintReview, { props: { session } });
    await fireEvent.input(getByDisplayValue('180'), { target: { value: '' } });
    await fireEvent.click(getByRole('button', { name: /rikmaImport.submit/ }));
    expect(executeAction.mock.calls[0][1].ops).toEqual([{ op: 'setSpec', key: 'i1', spec: { price: null, pricingMode: 'quote' } }]);
  });

  it('the owner flips who does a row; flipping back sends nothing', async () => {
    executeAction.mockResolvedValue({ success: true, data: { created: [], failed: [], invites: [] } });
    const { getByRole } = render(BlueprintReview, { props: { session } });
    const holder = () => getByRole('button', { name: /rikmaImport\.holder\.toggle/ });
    // The created resource shows its holder but cannot be flipped.
    expect(holder().textContent).toContain('rikmaImport.holder.me');

    await fireEvent.click(holder());
    expect(holder().textContent).toContain('rikmaImport.holder.open');
    await fireEvent.click(getByRole('button', { name: /rikmaImport\.submit/ }));
    expect(executeAction.mock.calls[0][1].ops).toEqual([{ op: 'setSpec', key: 'i3', spec: { holder: 'open' } }]);
  });
});

// Session 8 (2026-10-14): six missions whose description, hours and rate could
// not be seen before creation, and rikma fields that surfaced only after it.
describe('BlueprintReview — full detail before creation', () => {
  const series = {
    sessionId: '8',
    version: 5,
    projectId: null,
    projectName: null,
    fields: {
      track: 'idea',
      name: 'אני לא מסכים',
      currency: 'ILS',
      publicDescription: 'סדרה והפקה',
      descripFor: 'במאית ותסריטאי',
      linkToWebsite: 'https://example.org',
      vals: ['כנות', 'הקשבה'],
      restime: 'sth',
      location: { hint: 'תל אביב', lat: 32.08, lng: 34.78 }
    },
    items: [
      {
        key: 'm1',
        group: 'rikmaMissions',
        label: 'כתיבת תסריט',
        status: 'proposed',
        spec: {
          descrip: '<p>שלושה פרקים <strong>ראשונים</strong></p>',
          hours: 40,
          ratePerHour: 150,
          roles: ['תסריטאי'],
          skills: ['כתיבה'],
          workways: ['מרחוק'],
          holder: 'open'
        }
      },
      { key: 'p1', group: 'partners', label: 'דנה', status: 'proposed', spec: { email: 'dana@example.org' } },
      { key: 'm2', group: 'rikmaMissions', label: 'צילום', status: 'proposed', spec: { holder: 'partner', partnerKey: 'p1', hours: 10, ratePerHour: 200 } }
    ]
  };

  it('shows every rikma field that createWeave will receive', () => {
    const { getByDisplayValue, getByRole } = render(BlueprintReview, { props: { session: series } });
    for (const v of ['אני לא מסכים', 'סדרה והפקה', 'במאית ותסריטאי', 'https://example.org', 'כנות, הקשבה', 'תל אביב', 'ILS']) {
      expect(getByDisplayValue(v)).toBeTruthy();
    }
    expect((getByRole('combobox') as HTMLSelectElement).value).toBe('sth');
  });

  it('a mission row says hours × rate = value, and opens to its full detail', async () => {
    const { getAllByTestId, getByRole, getByDisplayValue, getByTestId, getByText } = render(BlueprintReview, { props: { session: series } });
    expect(getAllByTestId('row-sum')[0].textContent).toContain('rikmaImport.row.calc:40,150,6,000');

    const toggle = detailsToggle(getByRole, 'כתיבת תסריט');
    await fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(getByTestId('row-detail')).toBeTruthy();
    for (const v of ['40', '150', 'תסריטאי', 'כתיבה', 'מרחוק']) expect(getByDisplayValue(v)).toBeTruthy();
    // The description renders as formatted text, not as its markup.
    expect(getByText('ראשונים').tagName).toBe('STRONG');
  });

  it('edits in the detail travel as the same setSpec/setField ops', async () => {
    executeAction.mockResolvedValue({ success: true, data: { created: [], failed: [], invites: [] } });
    const { getByRole, getByDisplayValue, getByTestId } = render(BlueprintReview, { props: { session: series } });
    await fireEvent.click(detailsToggle(getByRole, 'כתיבת תסריט'));
    await fireEvent.input(getByDisplayValue('40'), { target: { value: '60' } });
    await fireEvent.input(getByDisplayValue('כתיבה'), { target: { value: 'כתיבה, דרמה' } });
    expect(getByTestId('row-value').textContent).toContain('rikmaImport.row.calc:60,150,9,000');
    await fireEvent.input(getByDisplayValue('במאית ותסריטאי'), { target: { value: 'במאית' } });
    // A script is not a website: left out of the ops, and said so.
    await fireEvent.input(getByDisplayValue('https://example.org'), { target: { value: 'javascript:alert(1)' } });
    expect(getByRole('alert').textContent).toContain('rikmaImport.field.linkInvalid');

    await fireEvent.click(getByRole('button', { name: /rikmaImport\.submit/ }));
    expect(executeAction.mock.calls[0][1].ops).toEqual([
      { op: 'setField', field: 'descripFor', value: 'במאית' },
      { op: 'setSpec', key: 'm1', spec: { hours: 60, skills: ['כתיבה', 'דרמה'] } }
    ]);
  });

  it('a partner opens to the email and the rows they bring', async () => {
    const { getByRole, getByDisplayValue, getByText } = render(BlueprintReview, { props: { session: series } });
    await fireEvent.click(detailsToggle(getByRole, 'דנה'));
    expect(getByDisplayValue('dana@example.org')).toBeTruthy();
    expect(getByText('rikmaImport.row.brings:צילום')).toBeTruthy();
  });

  it('"save" writes the edits into the session now, and the click then carries the new version', async () => {
    executeAction.mockResolvedValueOnce({
      success: true,
      data: { ...series, version: 6, fields: { ...series.fields, descripFor: 'במאית' }, applied: 1, rejected: [], conflict: false }
    });
    const { getByRole, getByDisplayValue, findByText } = render(BlueprintReview, { props: { session: series } });
    await fireEvent.input(getByDisplayValue('במאית ותסריטאי'), { target: { value: 'במאית' } });
    await fireEvent.click(getByRole('button', { name: 'rikmaImport.save.button' }));

    expect(executeAction.mock.calls[0]).toEqual([
      'setAssistantItems',
      { sessionId: '8', expectedVersion: 5, ops: [{ op: 'setField', field: 'descripFor', value: 'במאית' }], via: 'site' },
      { showErrorToast: false }
    ]);
    expect(await findByText(/rikmaImport\.save\.saved/)).toBeTruthy();

    executeAction.mockResolvedValueOnce({ success: true, data: { created: [], failed: [], invites: [] } });
    await fireEvent.click(getByRole('button', { name: /rikmaImport\.submit/ }));
    expect(executeAction.mock.calls[1][1]).toMatchObject({ expectedVersion: 6, ops: [] });
  });

  it('a save that meets a newer draft hands back to the page', async () => {
    executeAction.mockResolvedValue({ success: true, data: { ...series, version: 9, conflict: true } });
    const onConflict = vi.fn();
    const { getByRole, getByDisplayValue } = render(BlueprintReview, { props: { session: series, onConflict } });
    await fireEvent.input(getByDisplayValue('במאית ותסריטאי'), { target: { value: 'במאית' } });
    await fireEvent.click(getByRole('button', { name: 'rikmaImport.save.button' }));
    expect(onConflict).toHaveBeenCalled();
  });

  it('a created row opens read-only', async () => {
    const created = {
      ...series,
      items: [{ ...series.items[0], status: 'applied', createdRef: { type: 'mission', id: '3' } }]
    };
    const { getByRole, getByDisplayValue } = render(BlueprintReview, { props: { session: created } });
    await fireEvent.click(getByRole('button', { name: /rikmaImport\.row\.details/ }));
    expect((getByDisplayValue('40') as HTMLInputElement).disabled).toBe(true);
  });
});

/** The "details" toggle of the row with this name. */
function detailsToggle(getByRole: (role: string, o?: any) => HTMLElement, label: string): HTMLElement {
  const box = getByRole('checkbox', { name: label });
  const li = box.closest('li') as HTMLElement;
  return li.querySelector('button[aria-expanded]') as HTMLElement;
}
