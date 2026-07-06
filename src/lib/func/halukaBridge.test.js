import { describe, it, expect } from 'vitest';
import { halukaMemberRows } from './halukaBridge.js';

// Mirrors the shapes the haluka card reads: hervachti rows (fair share) and
// halukas (actual transfers), in both flat and Strapi `attributes` form.
const hervach = [
  { users_permissions_user: { data: { id: 8, attributes: { username: 'dana' } } }, amount: 100 },
  { users_permissions_user: { id: 13, username: 'noa' }, amount: 100 }
];

const halukot = [
  {
    attributes: {
      usersend: { data: { id: 8 } },
      userrecive: { data: { id: 13 } },
      amount: 20.5
    }
  }
];

describe('halukaMemberRows', () => {
  it('computes actual = fair + given − received per member', () => {
    const rows = halukaMemberRows(hervach, halukot);
    expect(rows).toEqual([
      { uid: '8', username: 'dana', fair: 100, actual: 120.5 },
      { uid: '13', username: 'noa', fair: 100, actual: 79.5 }
    ]);
  });

  it('ignores transfers of members without a fair-share row', () => {
    const rows = halukaMemberRows(hervach, [
      { usersend: { id: 99 }, userrecive: { id: 8 }, amount: 10 }
    ]);
    expect(rows.find((r) => r.uid === '8')?.actual).toBe(90);
    expect(rows.some((r) => r.uid === '99')).toBe(false);
  });

  it('falls back to the resolver and then the uid for usernames', () => {
    const rows = halukaMemberRows(
      [{ users_permissions_user: { data: { id: 5, attributes: {} } }, amount: 1 }],
      [],
      (uid) => (uid === '5' ? 'from-store' : null)
    );
    expect(rows[0].username).toBe('from-store');
  });

  it('handles empty / missing inputs', () => {
    expect(halukaMemberRows(null, null)).toEqual([]);
    expect(halukaMemberRows([], undefined)).toEqual([]);
  });
});
