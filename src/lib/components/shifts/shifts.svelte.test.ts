/**
 * Render tests for the shift grids (docs/PLAN_SHIFTS.md §9.2).
 *
 * The availability grid is where a member gives consent (§1.1), so what it
 * sends matters more than how it looks: one tap must send exactly the next
 * stance for exactly that shift, and a failed save must not leave the cell
 * showing a statement the server never recorded.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';

const echo = (key: string, params?: Record<string, unknown>) => (params ? `${key}${JSON.stringify(params)}` : key);
vi.mock('$lib/translations', () => ({
  t: { subscribe: (fn: any) => (fn(echo), () => {}) },
  locale: { subscribe: (fn: any) => (fn('en'), () => {}) },
  isRtl: { subscribe: (fn: any) => (fn(false), () => {}) }
}));
const executeAction = vi.fn();
vi.mock('$lib/client/actionClient', () => ({ executeAction: (...a: unknown[]) => executeAction(...a) }));
const toastError = vi.fn();
vi.mock('svelte-sonner', () => ({ toast: { error: (...a: unknown[]) => toastError(...a) } }));

import AvailabilityGrid from './AvailabilityGrid.svelte';
import RosterGrid from './RosterGrid.svelte';

const TZ = 'Asia/Jerusalem';
const cycle = { cycleStart: '2026-10-03T21:00:00.000Z', cycleEnd: '2026-10-10T21:00:00.000Z' };
const shifts = [
  { id: 's1', start: '2026-10-04T08:00:00.000Z', end: '2026-10-04T12:00:00.000Z', need: 1 },
  { id: 's2', start: '2026-10-05T08:00:00.000Z', end: '2026-10-05T12:00:00.000Z', need: 2 }
];

beforeEach(() => {
  executeAction.mockReset();
  toastError.mockReset();
});

describe('AvailabilityGrid', () => {
  it('shows each shift once, in the plan’s time zone, with its declaration', () => {
    const { getAllByRole, container } = render(AvailabilityGrid, {
      props: { shifts, declarations: [{ shiftId: 's1', stance: 'can' }], timeZone: TZ, ...cycle }
    });
    // 08:00Z is 11:00 in Jerusalem in October.
    expect(container.textContent).toContain('11:00–15:00');
    const cells = getAllByRole('button').filter((b) => b.className.includes('av-cell'));
    expect(cells).toHaveLength(2);
    expect(cells[0].getAttribute('aria-label')).toContain('shifts.stance.can');
    expect(cells[1].getAttribute('aria-label')).toContain('shifts.stance.none');
  });

  it('sends the next stance for exactly the tapped shift', async () => {
    executeAction.mockResolvedValue({ success: true });
    const { getAllByRole } = render(AvailabilityGrid, {
      props: { shifts, declarations: [{ shiftId: 's1', stance: 'can' }], timeZone: TZ, ...cycle }
    });
    const cells = getAllByRole('button').filter((b) => b.className.includes('av-cell'));
    await fireEvent.click(cells[0]);
    expect(executeAction).toHaveBeenCalledWith('declareShiftAvailability', { shiftId: 's1', stance: 'ifNeeded', prefRank: null });
    await fireEvent.click(cells[1]);
    await waitFor(() => expect(executeAction).toHaveBeenCalledTimes(2));
    expect(executeAction.mock.calls[1][1]).toMatchObject({ shiftId: 's2', stance: 'want' });
  });

  it('reverts the cell and says so when the save fails', async () => {
    executeAction.mockResolvedValue({ success: false, error: { message: 'no' } });
    const { getAllByRole } = render(AvailabilityGrid, {
      props: { shifts, declarations: [{ shiftId: 's1', stance: 'can' }], timeZone: TZ, ...cycle }
    });
    const cell = getAllByRole('button').filter((b) => b.className.includes('av-cell'))[0];
    await fireEvent.click(cell);
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('shifts.grid.saveError'));
    expect(cell.getAttribute('aria-label')).toContain('shifts.stance.can');
  });

  it('offers the top-choice star only on shifts the member would come to', () => {
    const { getAllByLabelText } = render(AvailabilityGrid, {
      props: {
        shifts,
        declarations: [
          { shiftId: 's1', stance: 'want', prefRank: 1 },
          { shiftId: 's2', stance: 'cannot' }
        ],
        timeZone: TZ,
        ...cycle
      }
    });
    const stars = getAllByLabelText('shifts.grid.topChoice');
    expect(stars).toHaveLength(1);
    expect(stars[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('tells a member where they already stand in the draft', () => {
    const { container } = render(AvailabilityGrid, {
      props: { shifts, declarations: [], ranks: { s1: 1, s2: 3 }, timeZone: TZ, ...cycle }
    });
    expect(container.textContent).toContain('shifts.grid.youComing');
    expect(container.textContent).toContain('shifts.grid.youBackup{"rank":3}');
  });
});

describe('RosterGrid', () => {
  const assignments = [
    { shiftId: 's1', userId: '7', rank: 1, state: 'confirmed' as const, reason: 'wanted' },
    { shiftId: 's1', userId: '8', rank: 2, state: 'draft' as const, reason: 'backup' },
    { shiftId: 's2', userId: '9', rank: 1, state: 'draft' as const, reason: 'onlyCandidate' }
  ];

  it('names who comes, marks the viewer, and flags a short shift', () => {
    const { container } = render(RosterGrid, {
      props: { shifts, assignments, names: { '7': 'Dana', '8': 'Ron', '9': 'Yoav' }, uid: '8', timeZone: TZ, ...cycle }
    });
    expect(container.textContent).toContain('Dana');
    // Ron is the viewer and appears as the backup on s1.
    expect(container.textContent).toContain('shifts.roster.you');
    // s2 needs two and has one.
    expect(container.textContent).toContain('shifts.roster.missing{"count":1}');
    expect(container.querySelector('[data-status="short"]')).not.toBeNull();
  });

  it('gives every placement its reason', () => {
    const { container } = render(RosterGrid, {
      props: { shifts, assignments, names: { '7': 'Dana' }, uid: '1', timeZone: TZ, ...cycle }
    });
    const dana = [...container.querySelectorAll('li.rg-name')].find((li) => li.textContent?.includes('Dana'))!;
    expect(dana.getAttribute('title')).toBe('shifts.reason.wanted');
  });
});
