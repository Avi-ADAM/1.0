import { describe, it, expect } from 'vitest';
import { computePlatformRings, getRing, type PlatformRing } from './platformRing';
import type { ConsentEvent } from './event';

const PLATFORM = 'platform-1lev1';

function ev(p: Partial<ConsentEvent> & { id: string; action: string; actor: string }): ConsentEvent {
  return {
    v: 1,
    id: p.id,
    actor: p.actor,
    device: p.device ?? 'd-' + p.actor,
    action: p.action as ConsentEvent['action'],
    subject: p.subject ?? { type: 'project', id: PLATFORM },
    predicate: p.predicate,
    parents: p.parents ?? [],
    ts: p.ts ?? 0,
    nonce: 'n',
    sig: 's'
  } as ConsentEvent;
}

describe('computePlatformRings — D-08 contributor co-op', () => {
  it('assigns null (not in map) for users who never joined', () => {
    const { rings } = computePlatformRings({ events: [], platformProjectId: PLATFORM });
    expect(getRing(rings, 'stranger')).toBeNull();
  });

  it('joiner with no approved work → outer ring', () => {
    const events = [
      ev({ id: 'j1', action: 'project.join', actor: 'newcomer', ts: 1 })
    ];
    const { rings, outerMembers, innerMembers } = computePlatformRings({
      events, platformProjectId: PLATFORM
    });
    expect(getRing(rings, 'newcomer')).toBe('outer');
    expect(outerMembers).toEqual(['newcomer']);
    expect(innerMembers).toEqual([]);
  });

  it('joiner with one mission.approve → inner ring', () => {
    const events = [
      ev({ id: 'j1', action: 'project.join', actor: 'avi', ts: 1 }),
      ev({ id: 'a1', action: 'mission.approve', actor: 'avi',
           subject: { type: 'mission', id: 'm-1' },
           predicate: { payee: 'avi' }, ts: 2 })
    ];
    const { rings, innerMembers } = computePlatformRings({
      events, platformProjectId: PLATFORM
    });
    expect(getRing(rings, 'avi')).toBe('inner');
    expect(innerMembers).toEqual(['avi']);
  });

  it('the user\'s exact scenario: 2 contributing, 8 committed-but-not-delivered', () => {
    // Founders Avi + Dana delivered missions; eight others joined but did no
    // approved work yet.
    const events: ConsentEvent[] = [
      ev({ id: 'jA', action: 'project.join', actor: 'avi',  ts: 1 }),
      ev({ id: 'jD', action: 'project.join', actor: 'dana', ts: 2 }),
      ev({ id: 'aA', action: 'mission.approve', actor: 'auditor',
           subject: { type: 'mission', id: 'm-A1' }, predicate: { payee: 'avi'  }, ts: 3 }),
      ev({ id: 'aD', action: 'mission.approve', actor: 'auditor',
           subject: { type: 'mission', id: 'm-D1' }, predicate: { payee: 'dana' }, ts: 4 }),
      ...Array.from({ length: 8 }, (_, i) =>
        ev({ id: `j${i}`, action: 'project.join', actor: `pending-${i}`, ts: 10 + i })
      )
    ];
    const { rings, innerMembers, outerMembers } = computePlatformRings({
      events, platformProjectId: PLATFORM
    });
    expect(innerMembers).toEqual(['avi', 'dana']);
    expect(outerMembers).toHaveLength(8);
    expect(rings.size).toBe(10);
    expect(getRing(rings, 'pending-3')).toBe('outer');
    expect(getRing(rings, 'avi')).toBe('inner');
  });

  it('mission.approve auto-joins the payee (audit-approved without explicit join)', () => {
    const events = [
      ev({ id: 'a1', action: 'mission.approve', actor: 'auditor',
           subject: { type: 'mission', id: 'm-1' },
           predicate: { payee: 'silent-contributor' }, ts: 1 })
    ];
    const { rings, innerMembers } = computePlatformRings({
      events, platformProjectId: PLATFORM
    });
    expect(getRing(rings, 'silent-contributor')).toBe('inner');
    expect(innerMembers).toEqual(['silent-contributor']);
  });

  it('falls back to actor when predicate.payee is absent', () => {
    const events = [
      ev({ id: 'a1', action: 'mission.approve', actor: 'self-credit',
           subject: { type: 'mission', id: 'm-1' }, ts: 1 })
    ];
    const { rings } = computePlatformRings({ events, platformProjectId: PLATFORM });
    expect(getRing(rings, 'self-credit')).toBe('inner');
  });

  it('project.leave removes the user from both rings', () => {
    const events = [
      ev({ id: 'j1', action: 'project.join', actor: 'avi', ts: 1 }),
      ev({ id: 'a1', action: 'mission.approve', actor: 'auditor',
           subject: { type: 'mission', id: 'm-1' },
           predicate: { payee: 'avi' }, ts: 2 }),
      ev({ id: 'l1', action: 'project.leave', actor: 'avi',
           parents: ['j1'], ts: 3 })
    ];
    const { rings, innerMembers, outerMembers } = computePlatformRings({
      events, platformProjectId: PLATFORM
    });
    expect(rings.has('avi')).toBe(false);
    expect(innerMembers).toEqual([]);
    expect(outerMembers).toEqual([]);
  });

  it('ignores events scoped to a different project (subject id mismatch)', () => {
    const events = [
      ev({ id: 'jX', action: 'project.join', actor: 'avi',
           subject: { type: 'project', id: 'some-other-project' }, ts: 1 }),
      ev({ id: 'aX', action: 'mission.approve', actor: 'avi',
           subject: { type: 'mission', id: 'm-1' },
           predicate: { payee: 'avi' }, ts: 2 })
    ];
    // The join doesn't count (other project), but mission.approve does
    // (mission events aren't scoped to a project subject and we credit the
    // payee unconditionally — auto-join applies).
    const { rings } = computePlatformRings({ events, platformProjectId: PLATFORM });
    expect(getRing(rings, 'avi')).toBe('inner');
  });

  it('promotion: outer ring user gets approved → moves to inner', () => {
    // Join first (outer), then later get a mission approved (becomes inner).
    const events = [
      ev({ id: 'j1', action: 'project.join', actor: 'becomes-inner', ts: 1 }),
      ev({ id: 'a1', action: 'mission.approve', actor: 'auditor',
           subject: { type: 'mission', id: 'm-1' },
           predicate: { payee: 'becomes-inner' }, ts: 100 })
    ];
    const { rings } = computePlatformRings({ events, platformProjectId: PLATFORM });
    expect(getRing(rings, 'becomes-inner')).toBe('inner');
  });
});

describe('getRing accessor', () => {
  it('returns null for unknown user', () => {
    const rings = new Map<string, PlatformRing>([['avi', 'inner']]);
    expect(getRing(rings, 'stranger')).toBeNull();
  });

  it('returns the stored value', () => {
    const rings = new Map<string, PlatformRing>([['avi', 'inner'], ['dana', 'outer']]);
    expect(getRing(rings, 'avi')).toBe('inner');
    expect(getRing(rings, 'dana')).toBe('outer');
  });
});
