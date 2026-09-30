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
    expect(getByText('concierge.no_notifications')).toBeTruthy();
    expect(container.querySelector('a')).toBeNull();
  });

  it('treats a missing list as empty', async () => {
    const { container, getByRole, getByText } = bell(undefined);
    expect(container.querySelector('.notif-pip')).toBeNull();
    await fireEvent.click(getByRole('button'));
    expect(getByText('concierge.no_notifications')).toBeTruthy();
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
    expect(getByText('concierge.pending_offers:2')).toBeTruthy();
    // A wish with no name still gets a row a customer can recognise as a wish.
    expect(getByText('concierge.notif_untitled')).toBeTruthy();
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
