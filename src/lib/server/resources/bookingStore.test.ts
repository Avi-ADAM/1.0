import { describe, it, expect, beforeEach, vi } from 'vitest';

const dynamicEnv: Record<string, string> = {};
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }));

const {
  bestEffort,
  bookingMode,
  bookingsEnabled,
  bookingsEnforced,
  confirmBookingAndRelease,
  createBooking,
  releaseBookings,
  syncPanui
} = await import('./bookingStore.js');

/**
 * A fake Strapi that serves one resource's ledger and records every mutation,
 * so the wiring between `conflictingHolds` and the writes can be asserted
 * without a database.
 */
function fakeStrapi(options: {
  bookings?: any[];
  sp?: Record<string, any> | null;
}) {
  const mutations: string[] = [];
  const sp = options.sp === null ? null : { kindOf: 'rent', panui: true, ...(options.sp ?? {}) };

  const exec = async (query: string) => {
    mutations.push(query);
    if (query.includes('resourceBookings(')) {
      return {
        data: {
          resourceBookings: { data: options.bookings ?? [] },
          sp: sp ? { data: { id: '3', attributes: sp } } : null
        }
      };
    }
    if (query.includes('createResourceBooking')) {
      return { data: { createResourceBooking: { data: { id: '99' } } } };
    }
    if (query.includes('updateResourceBooking')) {
      return { data: { updateResourceBooking: { data: { id: '1' } } } };
    }
    if (query.includes('updateSp')) {
      return { data: { updateSp: { data: { id: '3' } } } };
    }
    return { data: {} };
  };

  return {
    exec,
    mutations,
    /** Only the write documents, for readable assertions. */
    writes: () => mutations.filter((m) => m.startsWith('mutation'))
  };
}

const booking = (id: string, over: Record<string, any> = {}) => ({
  id,
  attributes: {
    start: '2026-04-05T00:00:00.000Z',
    end: '2026-04-12T00:00:00.000Z',
    quantity: 1,
    status: 'hold',
    holdExpiresAt: null,
    source: 'rikma',
    ...over
  }
});

beforeEach(() => {
  for (const key of Object.keys(dynamicEnv)) delete dynamicEnv[key];
});

describe('bookingMode — the rollout stage', () => {
  it('is off unless explicitly switched on', () => {
    expect(bookingMode()).toBe('off');
    expect(bookingsEnabled()).toBe(false);
    expect(bookingsEnforced()).toBe(false);
  });

  it('recognises shadow and enforce, case-insensitively', () => {
    dynamicEnv.RESOURCE_BOOKINGS = 'SHADOW';
    expect(bookingMode()).toBe('shadow');
    expect(bookingsEnabled()).toBe(true);
    expect(bookingsEnforced()).toBe(false);

    dynamicEnv.RESOURCE_BOOKINGS = 'enforce';
    expect(bookingsEnforced()).toBe(true);
  });

  it('treats anything unrecognised as off — the safe direction', () => {
    dynamicEnv.RESOURCE_BOOKINGS = 'yes-please';
    expect(bookingMode()).toBe('off');
  });
});

describe('bestEffort — a calendar row must never cost a decision', () => {
  it('does not run at all while the ledger is off', async () => {
    const ran = vi.fn();
    expect(await bestEffort('x', async () => ran())).toBeNull();
    expect(ran).not.toHaveBeenCalled();
  });

  it('swallows a failure and returns null', async () => {
    dynamicEnv.RESOURCE_BOOKINGS = 'shadow';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      await bestEffort('x', async () => {
        throw new Error('collection missing');
      })
    ).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('passes a success through unchanged', async () => {
    dynamicEnv.RESOURCE_BOOKINGS = 'shadow';
    expect(await bestEffort('x', async () => 'ok')).toBe('ok');
  });
});

describe('confirmBookingAndRelease', () => {
  beforeEach(() => {
    dynamicEnv.RESOURCE_BOOKINGS = 'enforce';
  });

  it('confirms the winner and releases the hold it collides with', async () => {
    const strapi = fakeStrapi({
      bookings: [booking('1'), booking('2', { start: '2026-04-08T00:00:00.000Z' })]
    });

    const result = await confirmBookingAndRelease(strapi.exec, { bookingId: '1', spId: '3' });

    expect(result).toEqual({ confirmed: '1', released: ['2'] });
    const writes = strapi.writes().join('\n');
    expect(writes).toContain('updateResourceBooking(id: "1", data: { status: confirmed }');
    expect(writes).toContain('cancelReason: conflict');
  });

  it('leaves a hold that does not overlap', async () => {
    const strapi = fakeStrapi({
      bookings: [
        booking('1'),
        booking('2', { start: '2026-04-12T00:00:00.000Z', end: '2026-04-20T00:00:00.000Z' })
      ]
    });
    const result = await confirmBookingAndRelease(strapi.exec, { bookingId: '1', spId: '3' });
    expect(result.released).toEqual([]);
  });

  it('never releases somebody else’s signed agreement', async () => {
    const strapi = fakeStrapi({
      bookings: [booking('1'), booking('2', { start: '2026-04-08T00:00:00.000Z', status: 'active' })]
    });
    const result = await confirmBookingAndRelease(strapi.exec, { bookingId: '1', spId: '3' });
    expect(result.released).toEqual([]);
  });

  it('a pool with room for both keeps both', async () => {
    const strapi = fakeStrapi({
      sp: { kindOf: 'perUnit', capacity: 10 },
      bookings: [
        booking('1', { quantity: 4 }),
        booking('2', { start: '2026-04-08T00:00:00.000Z', quantity: 4 })
      ]
    });
    const result = await confirmBookingAndRelease(strapi.exec, { bookingId: '1', spId: '3' });
    expect(result.released).toEqual([]);
  });

  it('refreshes the panui cache afterwards', async () => {
    const strapi = fakeStrapi({ bookings: [booking('1')] });
    await confirmBookingAndRelease(strapi.exec, { bookingId: '1', spId: '3' });
    expect(strapi.writes().join('\n')).toContain('updateSp(id: "3"');
  });
});

describe('releaseBookings — the resource coming back', () => {
  beforeEach(() => {
    dynamicEnv.RESOURCE_BOOKINGS = 'enforce';
  });

  const withProject = (id: string, projectId: string, status = 'active') =>
    booking(id, { status, project: { data: { id: projectId, attributes: {} } } });

  it('closes the live rows and marks them done', async () => {
    const strapi = fakeStrapi({ bookings: [withProject('1', '11'), withProject('2', '11')] });
    expect(await releaseBookings(strapi.exec, { spId: '3' })).toEqual(['1', '2']);
    expect(strapi.writes().join('\n')).toContain('status: done');
  });

  it('releases only the named rikma when one is given', async () => {
    const strapi = fakeStrapi({ bookings: [withProject('1', '11'), withProject('2', '22')] });
    expect(await releaseBookings(strapi.exec, { spId: '3', projectId: '11' })).toEqual(['1']);
  });

  it('leaves rows that are already finished alone', async () => {
    const strapi = fakeStrapi({
      bookings: [withProject('1', '11', 'done'), withProject('2', '11', 'cancelled')]
    });
    expect(await releaseBookings(strapi.exec, { spId: '3' })).toEqual([]);
  });
});

describe('syncPanui — the compatibility cache', () => {
  beforeEach(() => {
    dynamicEnv.RESOURCE_BOOKINGS = 'enforce';
  });

  it('writes true when the resource has future availability', async () => {
    const strapi = fakeStrapi({ bookings: [] });
    expect(await syncPanui(strapi.exec, '3')).toBe(true);
    expect(strapi.writes().join('\n')).toContain('panui: true');
  });

  it('writes false when it is booked out open-ended', async () => {
    const strapi = fakeStrapi({
      bookings: [booking('1', { start: '2020-01-01T00:00:00.000Z', end: null, status: 'active' })]
    });
    expect(await syncPanui(strapi.exec, '3')).toBe(false);
    expect(strapi.writes().join('\n')).toContain('panui: false');
  });

  it('keeps an unlimited resource available however much is booked', async () => {
    // The bug this guards: today a digital file lent to one rikma is locked
    // away from every other rikma, exactly like a van.
    const strapi = fakeStrapi({
      sp: { kindOf: 'total', availability: 'unlimited' },
      bookings: [booking('1', { start: '2020-01-01T00:00:00.000Z', end: null, status: 'active' })]
    });
    expect(await syncPanui(strapi.exec, '3')).toBe(true);
  });

  it('does nothing when the resource is gone', async () => {
    const strapi = fakeStrapi({ sp: null, bookings: [] });
    expect(await syncPanui(strapi.exec, '3')).toBeNull();
  });
});

describe('createBooking', () => {
  beforeEach(() => {
    dynamicEnv.RESOURCE_BOOKINGS = 'enforce';
  });

  it('writes the fields it was given and omits the ones it was not', async () => {
    const strapi = fakeStrapi({ bookings: [] });
    const id = await createBooking(strapi.exec, {
      spId: '3',
      start: '2026-04-05T00:00:00.000Z',
      end: null,
      quantity: 2,
      status: 'hold',
      source: 'concierge',
      sheirutId: '77'
    });

    expect(id).toBe('99');
    const write = strapi.writes()[0];
    expect(write).toContain('sp: "3"');
    expect(write).toContain('quantity: 2');
    expect(write).toContain('status: hold');
    expect(write).toContain('source: concierge');
    expect(write).toContain('sheirut: "77"');
    // An open-ended booking must not invent an end date.
    expect(write).not.toContain('end:');
    expect(write).not.toContain('project:');
  });

  it('rejects an unrecognised status rather than writing it', async () => {
    const strapi = fakeStrapi({ bookings: [] });
    await createBooking(strapi.exec, {
      spId: '3',
      start: '2026-04-05T00:00:00.000Z',
      status: 'nonsense' as any
    });
    expect(strapi.writes()[0]).not.toContain('nonsense');
  });
});
