/**
 * The bell is the customer's only pointer to offers waiting for their answer,
 * so it is tested for the two ways it can lie: a dot with nothing behind it,
 * and a panel that opens onto nothing without saying so.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { readable } from 'svelte/store';

// A `t` that returns the key plus its payload, so assertions see both.
vi.mock('$lib/translations', () => ({
  t: readable((key: string, payload?: Record<string, unknown>) =>
    payload ? `${key}:${Object.values(payload).join(',')}` : key
  )
}));

import ConciergeBell from './ConciergeBell.svelte';

const bell = (items?: { id: string; name: string; count: number }[]) =>
  render(ConciergeBell, { props: { items } });

describe('ConciergeBell — nothing waiting', () => {
  it('shows no dot, and says so when opened', async () => {
    const { container, getByRole, queryByRole, getByText } = bell([]);
    expect(container.querySelector('.notif-pip')).toBeNull();
    expect(queryByRole('region')).toBeNull();

    await fireEvent.click(getByRole('button'));
    expect(getByText('notices.bell.empty')).toBeTruthy();
    expect(container.querySelector('a')).toBeNull();
  });

  it('treats a missing list as empty', async () => {
    const { container, getByRole, getByText } = bell(undefined);
    expect(container.querySelector('.notif-pip')).toBeNull();
    await fireEvent.click(getByRole('button'));
    expect(getByText('notices.bell.empty')).toBeTruthy();
  });
});

describe('ConciergeBell — offers waiting', () => {
  const items = [
    { id: '7', name: 'A day off for mum', count: 2 },
    { id: '9', name: '', count: 1 }
  ];

  it('shows the dot and lists each wish with its count, linked to it', async () => {
    const { container, getByRole, getByText } = bell(items);
    expect(container.querySelector('.notif-pip')).not.toBeNull();

    await fireEvent.click(getByRole('button'));
    const links = [...container.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/concierge/7', '/concierge/9']);
    expect(getByText('A day off for mum')).toBeTruthy();
    expect(getByText('notices.bell.pendingOffers:2')).toBeTruthy();
    // A wish with no name still gets a row a customer can recognise as a wish.
    expect(getByText('notices.bell.untitled')).toBeTruthy();
    expect(container.querySelector('.bell-empty')).toBeNull();
  });
});

describe('ConciergeBell — closing', () => {
  it('closes on Escape, on a click outside, and when a row is followed', async () => {
    const { container, getByRole, queryByRole } = bell([{ id: '1', name: 'w', count: 1 }]);
    const open = async () => {
      if (!queryByRole('region')) await fireEvent.click(getByRole('button'));
      expect(queryByRole('region')).not.toBeNull();
    };

    await open();
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(queryByRole('region')).toBeNull();

    await open();
    await fireEvent.click(document.body);
    expect(queryByRole('region')).toBeNull();

    await open();
    // Clicking inside the panel must not close it…
    await fireEvent.click(container.querySelector('.bell-title')!);
    expect(queryByRole('region')).not.toBeNull();
    // …but following a row does (same-page links would otherwise leave it open).
    const link = container.querySelector('a')!;
    link.addEventListener('click', (e) => e.preventDefault());
    await fireEvent.click(link);
    expect(queryByRole('region')).toBeNull();
  });

  it('reflects open/closed on the button for assistive tech', async () => {
    const { getByRole } = bell([]);
    const btn = getByRole('button');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });
});

// ── notices (docs/inprogress/PLAN_SMART_NOTICES.md, stage 2) ────────────────────────

import { wishNotice } from '$lib/notices';

const offer = wishNotice(
  {
    viewer: 'wisher',
    wish: { id: '7', name: 'Kitchen' },
    proposal: {
      id: '70',
      status: 'suggested',
      proposerName: 'Avi',
      itemName: 'Plumbing',
      itemKind: 'mission',
      negotiation: { round: 0, yourTurn: true, amount: 6, price: 400, deadlineAt: null }
    }
  },
  Date.parse('2026-10-05T10:00:00.000Z')
)!;

const withNotices = (notices: any, items?: { id: string; name: string; count: number }[]) =>
  render(ConciergeBell, { props: { items, notices } });

describe('ConciergeBell — notices', () => {
  it('says each waiting thing as a sentence, with its terms and an expand into the wish', async () => {
    const { container, getByRole, getByText } = withNotices([offer]);
    expect(container.querySelector('.notif-pip')).not.toBeNull();

    await fireEvent.click(getByRole('button'));
    // People's words arrive wrapped in direction isolates (render.ts); compare without them.
    expect(getByText((text) => text.replace(/[\u2068\u2069]/g, '') === 'notices.wish.offer:Avi,Plumbing,Kitchen')).toBeTruthy();
    expect(getByText('lev.list.fact.hours:6')).toBeTruthy();
    expect(getByText('lev.list.fact.price:400')).toBeTruthy();
    const link = container.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/concierge/7#proposal-70');
    expect(link.textContent).toBe('notices.ui.expand');
  });

  it('an empty list means nothing waits — no dot, even when the old counts say otherwise', async () => {
    // A countered proposal still counts as "pending" for the wish, but the move is
    // the other side's: the bell must not call the customer for it.
    const { container, getByRole, getByText } = withNotices([], [{ id: '7', name: 'Kitchen', count: 1 }]);
    expect(container.querySelector('.notif-pip')).toBeNull();
    await fireEvent.click(getByRole('button'));
    expect(getByText('notices.bell.empty')).toBeTruthy();
  });

  it('notices that could not be read (null) fall back to the per-wish counts', async () => {
    const { container, getByRole } = withNotices(null, [{ id: '7', name: 'Kitchen', count: 2 }]);
    expect(container.querySelector('.notif-pip')).not.toBeNull();
    await fireEvent.click(getByRole('button'));
    expect(container.querySelector('a')!.getAttribute('href')).toBe('/concierge/7');
  });

  it('following a notice closes the panel', async () => {
    const { container, getByRole, queryByRole } = withNotices([offer]);
    await fireEvent.click(getByRole('button'));
    const link = container.querySelector('a')!;
    link.addEventListener('click', (e) => e.preventDefault());
    await fireEvent.click(link);
    expect(queryByRole('region')).toBeNull();
  });
});

// ── approve and hide (PLAN_SMART_NOTICES stage 3) ────────────────────────────

const { executeAction } = vi.hoisted(() => ({ executeAction: vi.fn() }));
vi.mock('$lib/client/actionClient', () => ({ executeAction }));
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));

const counter = wishNotice(
  {
    viewer: 'wisher',
    wish: { id: '7', name: 'Kitchen' },
    proposal: {
      id: '71',
      status: 'suggested',
      proposerName: 'Avi',
      itemName: 'Plumbing',
      itemKind: 'mission',
      negotiation: {
        round: 1,
        yourTurn: true,
        amount: 8,
        price: 520,
        deadlineAt: '2026-10-07T12:00:00.000Z',
        counters: [{ by: 'provider', note: 'More pipes' }]
      }
    }
  },
  Date.parse('2026-10-05T10:00:00.000Z')
)!;

const openBell = async (notices: any) => {
  const r = render(ConciergeBell, { props: { items: [], notices } });
  await fireEvent.click(r.container.querySelector('.notif-btn')!);
  return r;
};

describe('ConciergeBell — approve from the notice', () => {
  it('approve is the secondary action: it signs exactly what the notice shows, round included', async () => {
    executeAction.mockResolvedValueOnce({ success: true, data: {} });
    const { container, findByText } = await openBell([counter]);
    const approve = container.querySelector('.nr-approve') as HTMLButtonElement;
    expect(approve.textContent?.trim()).toBe('notices.ui.approve');
    await fireEvent.click(approve);
    expect(executeAction).toHaveBeenCalledWith(
      'acceptRatsonProposal',
      { proposalId: '71', ratsonId: '7', expectRound: 1 },
      { showErrorToast: false }
    );
    expect(await findByText('notices.ui.signed')).toBeTruthy();
    expect(container.querySelector('.nr-approve')).toBeNull();
  });

  it('says the terms moved instead of signing newer ones', async () => {
    executeAction.mockResolvedValueOnce({ success: false, error: { code: 'ROUND_MOVED', message: 'moved' } });
    const { container, findByText } = await openBell([counter]);
    await fireEvent.click(container.querySelector('.nr-approve')!);
    expect(await findByText('notices.ui.moved')).toBeTruthy();
  });
});

describe('ConciergeBell — hide is not reject', () => {
  it('warns that the clock keeps running before hiding a notice with a clock', async () => {
    executeAction.mockReset();
    executeAction.mockResolvedValue({ success: true, data: {} });
    const { container, findByRole, getByText } = await openBell([counter]);
    await fireEvent.click(container.querySelector('.nr-hide')!);
    // Nothing hidden yet — first the warning.
    expect(executeAction).not.toHaveBeenCalled();
    expect((await findByRole('alert')).textContent).toContain('notices.ui.hideClock');

    await fireEvent.click(getByText('notices.ui.hideConfirm'));
    expect(executeAction).toHaveBeenCalledWith('dismissNotice', { noticeKey: 'wish:71:v1' });
  });

  it('a hidden notice leaves the list and the dot, and comes back from "show hidden"', async () => {
    const { container, getByText, findByText } = await openBell([{ ...counter, hidden: true }]);
    expect(container.querySelector('.notif-pip')).toBeNull();
    expect(getByText('notices.bell.empty')).toBeTruthy();

    executeAction.mockResolvedValueOnce({ success: true, data: {} });
    await fireEvent.click(getByText('notices.ui.showHidden:1'));
    await fireEvent.click(getByText('notices.ui.unhide'));
    expect(executeAction).toHaveBeenCalledWith('restoreNotice', { noticeKey: 'wish:71:v1' });
    await findByText('notices.ui.approve');
    expect(container.querySelector('.notif-pip')).not.toBeNull();
  });
});
