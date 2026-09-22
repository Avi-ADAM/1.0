/**
 * Render tests for the staffing badge on the open board (PLAN_SHIFTS §2.6).
 *
 * The count itself is computed by src/lib/missions/headcount.ts and tested
 * there. What only a render can catch is the card saying the wrong thing: a
 * single-person mission growing a "1 of 1" badge, a proposal claiming seats are
 * filled, or a mission that was over-filled by a race reading as "5 of 4".
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import OpenMissionCard from './OpenMissionCard.svelte';

// `$t` echoes its key and params, so assertions read against keys rather than
// copy — the card must never contain user-facing strings of its own.
vi.mock('$lib/translations', () => {
  const echo = (key: string, params?: Record<string, unknown>) =>
    params ? `${key}${JSON.stringify(params)}` : key;
  return {
    t: { subscribe: (fn: any) => (fn(echo), () => {}) },
    locale: { subscribe: (fn: any) => (fn('en'), () => {}) },
    isRtl: { subscribe: (fn: any) => (fn(false), () => {}) }
  };
});

// The neighbours are not under test and each drags in stores of its own.
vi.mock('$lib/components/stipend/MissionStipendOffer.svelte', async () => ({
  default: (await import('./__mocks__/Empty.svelte')).default
}));
vi.mock('$lib/components/share/shareButtons/index.svelte', async () => ({
  default: (await import('./__mocks__/Empty.svelte')).default
}));
vi.mock('$lib/components/archive/ArchiveObjectButton.svelte', async () => ({
  default: (await import('./__mocks__/Empty.svelte')).default
}));
vi.mock('$lib/celim/tile.svelte', async () => ({
  default: (await import('./__mocks__/Empty.svelte')).default
}));

const seat = (lifecycle: string | null) => ({ id: '1', attributes: { lifecycle, finnished: false } });

function card(attributes: Record<string, unknown>, pending = false) {
  return render(OpenMissionCard, {
    props: { node: { id: '7', attributes: { name: 'Front desk', ...attributes } }, projectId: '3', pending }
  });
}

describe('OpenMissionCard — staffing badge', () => {
  it('shows nothing for an ordinary single-person mission', () => {
    const { container } = card({ howMeny: null });
    expect(container.textContent).not.toContain('moach.open.staffing');
    expect(container.textContent).not.toContain('moach.open.seatsLeft');
  });

  it('shows how many of the seats are filled and how many are left', () => {
    const { container } = card({
      howMeny: '4',
      mesimabetahaliches: { data: [seat('active'), seat(null), seat('released')] }
    });
    // The released member does not hold a seat; the legacy (null) one does.
    expect(container.textContent).toContain('moach.open.staffing{"filled":2,"need":4}');
    expect(container.textContent).toContain('moach.open.seatsLeft{"count":2}');
  });

  it('uses the singular when exactly one seat is left', () => {
    const { container } = card({
      howMeny: 3,
      mesimabetahaliches: { data: [seat('active'), seat('active')] }
    });
    expect(container.textContent).toContain('moach.open.seatsLeftOne');
    expect(container.textContent).not.toContain('moach.open.seatsLeft{');
  });

  it('says plainly when a race over-filled the mission', () => {
    const { container } = card({
      howMeny: 2,
      mesimabetahaliches: { data: [seat('active'), seat('active'), seat('active')] }
    });
    expect(container.textContent).toContain('moach.open.overfilled{"filled":3,"need":2}');
    expect(container.textContent).not.toContain('moach.open.seatsLeft');
  });

  it('on a proposal, states the need without claiming any seat is filled', () => {
    const { container } = card({ howMeny: '5' }, true);
    expect(container.textContent).toContain('moach.open.staffingNeed{"need":5}');
    expect(container.textContent).not.toContain('moach.open.staffing{');
    expect(container.textContent).not.toContain('moach.open.seatsLeft');
  });
});
