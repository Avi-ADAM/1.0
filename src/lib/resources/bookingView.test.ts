import { describe, it, expect } from 'vitest';
import {
  agendaGroups,
  bookingColor,
  filterBookings,
  normalizeBookingNode,
  normalizeBookings,
  normalizeResourceNode,
  resourcesInBookings,
  toCalendarEvents
} from './bookingView.js';
import type { BookingView } from './bookingView.js';

function node(over: Record<string, any> = {}) {
  return {
    id: 7,
    attributes: {
      start: '2026-04-05T00:00:00.000Z',
      end: '2026-04-12T00:00:00.000Z',
      quantity: 2,
      status: 'confirmed',
      source: 'rikma',
      note: 'the good projector',
      sp: { data: { id: 3, attributes: { name: 'מקרן' } } },
      project: {
        data: { id: 11, attributes: { projectName: 'ריקמת האור', profilePic: { data: { attributes: { url: '/p.png' } } } } }
      },
      ...over
    }
  };
}

const view = (over: Partial<BookingView> = {}): BookingView => ({
  id: 'x',
  start: '2026-04-05T00:00:00.000Z',
  end: '2026-04-12T00:00:00.000Z',
  quantity: 1,
  status: 'confirmed',
  source: 'rikma',
  note: null,
  spId: '3',
  spName: 'מקרן',
  counterparty: { kind: 'project', id: '11', name: 'ריקמת האור', pic: null },
  ...over
});

describe('normalizeBookingNode', () => {
  it('flattens Strapi nesting into one object', () => {
    const result = normalizeBookingNode(node());
    expect(result).toMatchObject({
      id: '7',
      start: '2026-04-05T00:00:00.000Z',
      end: '2026-04-12T00:00:00.000Z',
      quantity: 2,
      status: 'confirmed',
      source: 'rikma',
      spId: '3',
      spName: 'מקרן'
    });
    expect(result?.counterparty).toEqual({
      kind: 'project',
      id: '11',
      name: 'ריקמת האור',
      pic: '/p.png'
    });
  });

  it('reads a concierge customer when there is no project', () => {
    const result = normalizeBookingNode(
      node({ project: null, sheirut: { data: { id: 4, attributes: { name: 'דנה' } } }, source: 'concierge' })
    );
    expect(result?.counterparty).toEqual({ kind: 'sheirut', id: '4', name: 'דנה', pic: null });
    expect(result?.source).toBe('concierge');
  });

  it('a self-blackout has no counterparty at all', () => {
    const result = normalizeBookingNode(node({ project: null, source: 'blackout' }));
    expect(result?.counterparty.kind).toBe('none');
  });

  it('an unrecognised status reads as confirmed — never silently free', () => {
    expect(normalizeBookingNode(node({ status: 'weird' }))?.status).toBe('confirmed');
    expect(normalizeBookingNode(node({ status: null }))?.status).toBe('confirmed');
  });

  it('a missing or zero quantity is one unit', () => {
    expect(normalizeBookingNode(node({ quantity: null }))?.quantity).toBe(1);
    expect(normalizeBookingNode(node({ quantity: 0 }))?.quantity).toBe(1);
  });

  it('keeps an open-ended booking open', () => {
    expect(normalizeBookingNode(node({ end: null }))?.end).toBeNull();
  });

  it('drops rows with no start, and sorts the rest', () => {
    const list = normalizeBookings([
      node({ start: '2026-06-01T00:00:00.000Z' }),
      node({ start: null }),
      node({ start: '2026-01-01T00:00:00.000Z' })
    ]);
    expect(list.map((b) => b.start)).toEqual(['2026-01-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z']);
  });
});

describe('normalizeResourceNode', () => {
  it('keeps availability null so the legacy derivation still runs', () => {
    const result = normalizeResourceNode({ id: 3, attributes: { name: 'מקרן', kindOf: 'rent' } });
    expect(result).toEqual({
      id: '3',
      name: 'מקרן',
      kindOf: 'rent',
      availability: null,
      capacity: null,
      hm: null,
      sdate: null,
      fdate: null,
      leadTimeHours: null,
      granularity: null
    });
  });
});

describe('filterBookings', () => {
  const bookings = [
    view({ id: 'a', spId: '1', status: 'confirmed', source: 'rikma' }),
    view({ id: 'b', spId: '2', status: 'hold', source: 'concierge', counterparty: { kind: 'sheirut', id: '9', name: 'דנה', pic: null } }),
    view({ id: 'c', spId: '1', status: 'cancelled', source: 'blackout', counterparty: { kind: 'none', id: null, name: '', pic: null } })
  ];

  it('an empty filter object keeps everything', () => {
    expect(filterBookings(bookings)).toHaveLength(3);
    expect(filterBookings(bookings, { spIds: [], statuses: [] })).toHaveLength(3);
  });

  it('filters to one resource — the “only this one” mode', () => {
    expect(filterBookings(bookings, { spIds: ['1'] }).map((b) => b.id)).toEqual(['a', 'c']);
  });

  it('filters by counterparty kind and by source', () => {
    expect(filterBookings(bookings, { counterparties: ['sheirut'] }).map((b) => b.id)).toEqual(['b']);
    expect(filterBookings(bookings, { sources: ['blackout'] }).map((b) => b.id)).toEqual(['c']);
  });

  it('liveOnly drops done and cancelled', () => {
    expect(filterBookings(bookings, { liveOnly: true }).map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('filters by overlapping range, not containment', () => {
    const range = { start: new Date('2026-04-10T00:00:00Z'), end: new Date('2026-04-20T00:00:00Z') };
    expect(filterBookings(bookings, { range })).toHaveLength(3);
    const after = { start: new Date('2026-05-01T00:00:00Z'), end: new Date('2026-05-10T00:00:00Z') };
    expect(filterBookings(bookings, { range: after })).toHaveLength(0);
  });

  it('an open-ended booking survives every future range', () => {
    const open = [view({ id: 'o', end: null })];
    const far = { start: new Date('2030-01-01T00:00:00Z'), end: new Date('2030-02-01T00:00:00Z') };
    expect(filterBookings(open, { range: far })).toHaveLength(1);
  });
});

describe('bookingColor', () => {
  it('a hold is dashed — it is a claim, not an agreement', () => {
    expect(bookingColor({ status: 'hold', source: 'rikma' }).dashed).toBe(true);
    expect(bookingColor({ status: 'confirmed', source: 'rikma' }).dashed).toBe(false);
  });

  it('a self-blackout is neutral whatever its status', () => {
    expect(bookingColor({ status: 'confirmed', source: 'blackout' })).toEqual({
      background: 'var(--surface-muted)',
      border: 'var(--surface-line)',
      dashed: true
    });
  });

  it('every colour is a theme token, never a hex literal', () => {
    for (const status of ['hold', 'confirmed', 'active', 'done', 'cancelled'] as const) {
      const color = bookingColor({ status, source: 'rikma' });
      expect(color.background).toMatch(/^var\(--/);
      expect(color.border).toMatch(/^var\(--/);
    }
  });
});

describe('toCalendarEvents', () => {
  it('clamps an open-ended booking to the visible edge without touching the booking', () => {
    const openEndedUntil = new Date('2026-12-31T00:00:00.000Z');
    const bookings = [view({ id: 'o', end: null })];
    const events = toCalendarEvents(bookings, { title: (b) => b.spName, openEndedUntil });
    expect(events[0].end).toBe('2026-12-31T00:00:00.000Z');
    expect(events[0].extendedProps.booking.end).toBeNull();
    expect(events[0].title).toBe('מקרן');
  });
});

describe('agendaGroups', () => {
  const now = new Date('2026-04-10T00:00:00Z');

  it('groups by starting month', () => {
    const groups = agendaGroups(
      [
        view({ id: 'a', start: '2026-05-02T00:00:00Z', end: '2026-05-04T00:00:00Z' }),
        view({ id: 'b', start: '2026-06-02T00:00:00Z', end: '2026-06-04T00:00:00Z' })
      ],
      now
    );
    expect(groups.map((g) => g.month)).toEqual(['2026-05', '2026-06']);
  });

  it('files an already-running booking under the current month', () => {
    // Started in February, still out today → belongs at the top of the screen,
    // not buried in a past month the user has scrolled away from.
    const groups = agendaGroups(
      [view({ id: 'r', start: '2026-02-01T00:00:00Z', end: '2026-08-01T00:00:00Z' })],
      now
    );
    expect(groups.map((g) => g.month)).toEqual(['2026-04']);
  });

  it('an open-ended running booking counts as ongoing too', () => {
    const groups = agendaGroups([view({ id: 'r', start: '2026-02-01T00:00:00Z', end: null })], now);
    expect(groups.map((g) => g.month)).toEqual(['2026-04']);
  });
});

describe('resourcesInBookings', () => {
  it('lists each resource once, for the filter chips', () => {
    expect(
      resourcesInBookings([
        view({ id: 'a', spId: '1', spName: 'מקרן' }),
        view({ id: 'b', spId: '1', spName: 'מקרן' }),
        view({ id: 'c', spId: '2', spName: 'רכב' }),
        view({ id: 'd', spId: null })
      ])
    ).toEqual([
      { id: '1', name: 'מקרן' },
      { id: '2', name: 'רכב' }
    ]);
  });
});
