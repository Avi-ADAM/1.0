import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { readable } from 'svelte/store';

/**
 * PLAN_SHARED_PURCHASE §5 — Lev judged the wish happens only at volume. The card
 * offers the owner a pool; joining and opening are her taps, and they carry the
 * wish id so the pool knows which wish it grew from.
 */

const executeAction = vi.fn();
vi.mock('$lib/client/actionClient', () => ({ executeAction: (...a: unknown[]) => executeAction(...a) }));
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));
vi.mock('svelte-sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock('$lib/translations', () => ({
  t: readable((key: string, vars?: Record<string, unknown>) => (vars ? `${key} ${JSON.stringify(vars)}` : key))
}));

const WishPoolCard = (await import('./WishPoolCard.svelte')).default;

const wish = {
  id: 50,
  name: 'סל ירקות שבועי',
  isOnline: false,
  lat: 32.08,
  lng: 34.78,
  radius: 10,
  categories: [{ id: 3 }]
};
const volume = { minPeople: 10, why: 'חקלאי פותח קו מ-10 סלים' };

const button = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(text)) as HTMLButtonElement;

describe('WishPoolCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeAction.mockResolvedValue({ success: true, data: { maagadId: '9' } });
  });

  it('says why others are needed and lists the pools that fit', () => {
    const pool = {
      volume,
      mine: null,
      similar: [{ id: '7', name: 'סל ירקות רמת גן', members: 4, distanceKm: 1.2 }],
      canOpen: true
    };
    const { baseElement } = render(WishPoolCard as any, { props: { pool, wish } });
    const text = baseElement.textContent ?? '';
    expect(text).toContain(volume.why);
    expect(text).toContain('concierge.pool_min {"count":10}');
    expect(text).toContain('סל ירקות רמת גן');
    expect(baseElement.querySelector('a[href="/maagad/7"]')).not.toBeNull();
  });

  it('joins a pool with the wish attached', async () => {
    const pool = { volume, mine: null, similar: [{ id: '7', name: 'סל', members: 4, distanceKm: null }], canOpen: true };
    const { baseElement } = render(WishPoolCard as any, { props: { pool, wish } });
    await fireEvent.click(button(baseElement, 'concierge.pool_join'));
    await waitFor(() =>
      expect(executeAction).toHaveBeenCalledWith('joinMaagad', { maagadId: '7', ratsonId: '50' })
    );
  });

  it('opens a pool at the wish’s place, with its categories', async () => {
    const pool = { volume, mine: null, similar: [], canOpen: true };
    const { baseElement } = render(WishPoolCard as any, { props: { pool, wish } });
    await fireEvent.click(button(baseElement, 'concierge.pool_open'));
    await waitFor(() =>
      expect(executeAction).toHaveBeenCalledWith('openMaagad', {
        name: wish.name,
        scope: 'local',
        lat: 32.08,
        lng: 34.78,
        radius: 10,
        ratsonId: '50',
        categoryIds: ['3']
      })
    );
  });

  it('opens a global pool for an online wish', async () => {
    const pool = { volume, mine: null, similar: [], canOpen: true };
    const { baseElement } = render(WishPoolCard as any, {
      props: { pool, wish: { ...wish, isOnline: true } }
    });
    await fireEvent.click(button(baseElement, 'concierge.pool_open'));
    await waitFor(() =>
      expect(executeAction).toHaveBeenCalledWith(
        'openMaagad',
        expect.objectContaining({ scope: 'global', lat: null, lng: null })
      )
    );
  });

  it('asks for a place instead of offering to open, when the wish has none', () => {
    const pool = { volume, mine: null, similar: [], canOpen: false };
    const { baseElement } = render(WishPoolCard as any, { props: { pool, wish } });
    expect(button(baseElement, 'concierge.pool_open')).toBeUndefined();
    expect(baseElement.textContent).toContain('concierge.pool_need_place');
  });

  it('shows the pool she is in, and offers nothing more', () => {
    const pool = {
      volume,
      mine: { id: '7', name: 'סל', members: 5, distanceKm: null, memberStatus: 'interested' },
      similar: [],
      canOpen: true
    };
    const { baseElement } = render(WishPoolCard as any, { props: { pool, wish } });
    expect(baseElement.textContent).toContain('concierge.pool_in');
    expect(baseElement.querySelector('button')).toBeNull();
  });

  it('an invitation from the clustering job is still hers to accept', async () => {
    const pool = {
      volume: null,
      mine: { id: '7', name: 'סל', members: 3, distanceKm: null, memberStatus: 'suggested' },
      similar: [],
      canOpen: true
    };
    const { baseElement } = render(WishPoolCard as any, { props: { pool, wish } });
    expect(baseElement.textContent).toContain('concierge.pool_invited');
    expect(executeAction).not.toHaveBeenCalled();
    await fireEvent.click(button(baseElement, 'concierge.pool_join'));
    await waitFor(() =>
      expect(executeAction).toHaveBeenCalledWith('joinMaagad', { maagadId: '7', ratsonId: '50' })
    );
  });
});
