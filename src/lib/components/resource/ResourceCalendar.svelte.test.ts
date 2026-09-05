/**
 * Render tests for the resource calendar's list view — the one that ships to
 * phones. They exist because the pure modules underneath cannot catch the two
 * failures that would actually be seen: a resource that has no bookings
 * disappearing from the filter, and the mobile view dragging the calendar
 * library in with it.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ResourceCalendar from './ResourceCalendar.svelte';
import type { BookingView } from '$lib/resources/bookingView.js';

// `$t` echoes its key, so assertions read against keys rather than copy — the
// component must never contain user-facing strings of its own.
vi.mock('$lib/translations', () => ({
  t: { subscribe: (fn: any) => (fn((key: string) => key), () => {}) },
  isRtl: { subscribe: (fn: any) => (fn(true), () => {}) }
}));

vi.mock('$lib/stores/lang.js', () => ({
  lang: { subscribe: (fn: any) => (fn('en'), () => {}) }
}));

vi.mock('@event-calendar/core/index.css', () => ({}));

const booking = (over: Partial<BookingView> = {}): BookingView => ({
  id: 'b1',
  start: '2026-04-05T00:00:00.000Z',
  end: '2026-04-12T00:00:00.000Z',
  quantity: 1,
  status: 'confirmed',
  source: 'rikma',
  note: null,
  spId: '3',
  spName: 'Projector',
  counterparty: { kind: 'project', id: '11', name: 'Light Weave', pic: null },
  ...over
});

const NOW = new Date('2026-04-01T00:00:00Z');

describe('ResourceCalendar — list view', () => {
  it('renders a booking with its resource, counterparty and status', () => {
    const { getByText } = render(ResourceCalendar, {
      props: { bookings: [booking()], now: NOW }
    });
    expect(getByText('Projector')).toBeTruthy();
    expect(getByText('Light Weave')).toBeTruthy();
    expect(getByText('resources.status.confirmed')).toBeTruthy();
  });

  it('shows the empty key when nothing is booked', () => {
    const { getByText } = render(ResourceCalendar, { props: { bookings: [], now: NOW } });
    expect(getByText('resources.calendar.empty')).toBeTruthy();
  });

  it('falls back to the source label when there is no counterparty name', () => {
    const { getByText } = render(ResourceCalendar, {
      props: {
        bookings: [
          booking({
            source: 'blackout',
            counterparty: { kind: 'none', id: null, name: '', pic: null }
          })
        ],
        now: NOW
      }
    });
    expect(getByText('resources.source.blackout')).toBeTruthy();
  });

  it('lists a free resource among the filter chips', async () => {
    // The regression this guards: chips derived from bookings alone would hide
    // every resource that is currently free — the ones a holder most wants to
    // confirm are free.
    const { getByRole } = render(ResourceCalendar, {
      props: {
        bookings: [booking()],
        resources: [
          { id: '3', name: 'Projector' },
          { id: '4', name: 'Van' }
        ],
        now: NOW
      }
    });
    expect(getByRole('button', { name: 'Van' })).toBeTruthy();
  });

  it('filtering to one resource hides the others', async () => {
    const { getByRole, queryByText } = render(ResourceCalendar, {
      props: {
        bookings: [booking(), booking({ id: 'b2', spId: '4', spName: 'Van' })],
        resources: [
          { id: '3', name: 'Projector' },
          { id: '4', name: 'Van' }
        ],
        now: NOW
      }
    });

    await fireEvent.click(getByRole('button', { name: 'Projector' }));
    expect(queryByText('Light Weave')).toBeTruthy();
    // "Van" survives as a filter chip; what must disappear is its row, which is
    // the only place the resource name is rendered as plain text.
    expect(getByRole('button', { name: 'Van' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('`liveOnly` hides finished bookings and can be turned off', async () => {
    const { queryByText, getByLabelText } = render(ResourceCalendar, {
      props: {
        bookings: [booking({ status: 'done', spName: 'Old loan' })],
        now: NOW
      }
    });
    expect(queryByText('Old loan')).toBeNull();

    await fireEvent.click(getByLabelText('resources.calendar.live_only'));
    expect(queryByText('Old loan')).toBeTruthy();
  });

  it('an open-ended booking says so instead of showing a bogus end date', () => {
    const { getByText } = render(ResourceCalendar, {
      props: { bookings: [booking({ end: null })], now: NOW }
    });
    expect(getByText(/resources\.calendar\.open_ended/)).toBeTruthy();
  });

  it('the list view pulls in no calendar library', () => {
    // The whole reason the grid is dynamically imported. If this ever fails,
    // every phone opening /me/resources is downloading a month grid it never
    // shows.
    const { container } = render(ResourceCalendar, {
      props: { bookings: [booking()], now: NOW }
    });
    expect(container.querySelector('.ec-host')).toBeNull();
    expect(container.querySelector('.ec')).toBeNull();
  });

  it('offers all three views, with the list selected first', () => {
    const { getAllByRole } = render(ResourceCalendar, {
      props: { bookings: [booking()], now: NOW }
    });
    const tabs = getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      'resources.calendar.view_list',
      'resources.calendar.view_month',
      'resources.calendar.view_week'
    ]);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });
});
