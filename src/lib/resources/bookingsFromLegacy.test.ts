import { describe, it, expect } from 'vitest';
import { bookingsFromLegacy, resourcesFromSps } from './bookingsFromLegacy.js';

const NOW = new Date('2026-04-10T00:00:00Z');

const project = (id = 11, name = 'ריקמת האור') => ({
  data: { id, attributes: { projectName: name, profilePic: { data: { attributes: { url: '/p.png' } } } } }
});

function engine(id: number, attrs: Record<string, any> = {}) {
  return {
    id,
    attributes: {
      name: 'מקרן',
      start: '2026-04-01T00:00:00.000Z',
      end: '2026-05-01T00:00:00.000Z',
      status_mashab: 'active',
      finnished: false,
      kindOf: 'monthly',
      recurring: true,
      project: project(),
      ...attrs
    }
  };
}

function archive(id: number, attrs: Record<string, any> = {}) {
  return {
    id,
    attributes: {
      name: 'רכב',
      kindOf: 'rent',
      hm: 1,
      sqadualed: '2026-06-01T00:00:00.000Z',
      sqadualef: '2026-06-10T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      sp: { data: { id: 3, attributes: { name: 'רכב' } } },
      project: project(),
      ...attrs
    }
  };
}

function payload(engines: any[] = [], archives: any[] = []) {
  return {
    usersPermissionsUser: {
      data: {
        id: '1',
        attributes: {
          mashabetahaliches: { data: engines },
          rikmashes: { data: archives }
        }
      }
    }
  };
}

describe('bookingsFromLegacy', () => {
  it('turns a live engine into an active booking', () => {
    const [booking] = bookingsFromLegacy(payload([engine(5)]), { now: NOW });
    expect(booking).toMatchObject({
      id: 'mash:5',
      start: '2026-04-01T00:00:00.000Z',
      end: '2026-05-01T00:00:00.000Z',
      status: 'active',
      source: 'rikma',
      quantity: 1
    });
    expect(booking.counterparty).toEqual({ kind: 'project', id: '11', name: 'ריקמת האור', pic: '/p.png' });
  });

  it('reads a rental out of the archive — the only record a `rent` grant leaves', () => {
    // This is the case that has no engine at all today: `runResourceAskmAcceptance`
    // only builds one when `recurring === true`.
    const [booking] = bookingsFromLegacy(payload([], [archive(9)]), { now: NOW });
    expect(booking).toMatchObject({
      id: 'rikmash:9',
      start: '2026-06-01T00:00:00.000Z',
      end: '2026-06-10T00:00:00.000Z',
      status: 'confirmed',
      spId: '3',
      spName: 'רכב'
    });
  });

  it('never counts one grant twice', () => {
    // The archive points at the engine; showing both would paint the resource
    // as doubly occupied.
    const linked = archive(9, { mashabetahalich: { data: { id: 5, attributes: {} } } });
    const result = bookingsFromLegacy(payload([engine(5)], [linked]), { now: NOW });
    expect(result.map((b) => b.id)).toEqual(['mash:5']);
  });

  it('de-duplicates from the engine side too', () => {
    const withRikmash = engine(5, { rikmash: { data: { id: 9, attributes: {} } } });
    const result = bookingsFromLegacy(payload([withRikmash], [archive(9)]), { now: NOW });
    expect(result.map((b) => b.id)).toEqual(['mash:5']);
  });

  it('gives the engine the resource identity its paired archive carries', () => {
    const withRikmash = engine(5, { rikmash: { data: { id: 9, attributes: {} } } });
    const [booking] = bookingsFromLegacy(payload([withRikmash], [archive(9)]), { now: NOW });
    expect(booking.spId).toBe('3');
    expect(booking.spName).toBe('רכב');
  });

  it('maps the engine lifecycle before falling back to dates', () => {
    const cases = [
      [engine(1, { status_mashab: 'cancelled' }), 'cancelled'],
      [engine(2, { finnished: true }), 'done'],
      [engine(3, { status_mashab: 'closed' }), 'done'],
      [engine(4, { status_mashab: 'draft' }), 'hold']
    ] as const;
    for (const [node, expected] of cases) {
      const [booking] = bookingsFromLegacy(payload([node]), { now: NOW });
      expect(booking.status).toBe(expected);
    }
  });

  it('an open-ended engine is active, not finished', () => {
    const [booking] = bookingsFromLegacy(payload([engine(5, { end: null })]), { now: NOW });
    expect(booking.end).toBeNull();
    expect(booking.status).toBe('active');
  });

  it('a closed window in the past reads as done', () => {
    const past = archive(9, { sqadualed: '2026-01-01T00:00:00Z', sqadualef: '2026-02-01T00:00:00Z' });
    const [booking] = bookingsFromLegacy(payload([], [past]), { now: NOW });
    expect(booking.status).toBe('done');
  });

  it('falls back to createdAt rather than dropping an undated grant', () => {
    // The resource did go out; we were just never told from when. Hiding it
    // would understate occupancy, which is the failure that matters.
    const undated = archive(9, { sqadualed: null, sqadualef: null });
    const [booking] = bookingsFromLegacy(payload([], [undated]), { now: NOW });
    expect(booking.start).toBe('2026-01-01T00:00:00.000Z');
    expect(booking.end).toBeNull();
    expect(booking.status).toBe('active');
  });

  it('a grant with no rikma is a personal one', () => {
    const personal = archive(9, { project: null });
    const [booking] = bookingsFromLegacy(payload([], [personal]), { now: NOW });
    expect(booking.source).toBe('personal');
    expect(booking.counterparty.kind).toBe('none');
  });

  it('reads `hm` as the quantity for a pooled grant', () => {
    const [booking] = bookingsFromLegacy(payload([], [archive(9, { hm: 4 })]), { now: NOW });
    expect(booking.quantity).toBe(4);
  });

  it('sorts by start and survives an empty or malformed payload', () => {
    const result = bookingsFromLegacy(
      payload(
        [engine(1, { start: '2026-09-01T00:00:00Z' }), engine(2, { start: null })],
        [archive(3, { sqadualed: '2026-03-01T00:00:00Z' })]
      ),
      { now: NOW }
    );
    expect(result.map((b) => b.id)).toEqual(['rikmash:3', 'mash:1']);
    expect(bookingsFromLegacy(null)).toEqual([]);
    expect(bookingsFromLegacy({})).toEqual([]);
  });
});

describe('resourcesFromSps', () => {
  it('flattens the holder’s resource list', () => {
    expect(
      resourcesFromSps({
        usersPermissionsUser: {
          data: {
            attributes: {
              sps: { data: [{ id: 3, attributes: { name: 'רכב', kindOf: 'rent' } }] }
            }
          }
        }
      })
    ).toEqual([{ id: '3', name: 'רכב', kindOf: 'rent' }]);
    expect(resourcesFromSps(null)).toEqual([]);
  });
});
