import { describe, it, expect } from 'vitest';
import {
  getActStatus,
  getActProgress,
  getQuickActions,
  hasAssignee,
  hasMissionLink,
  isAwaitingPlacement,
  type ActRowLike
} from './actStatus.js';

/** A bare act: created, nobody on it, nothing linked. */
const bare = (over: Partial<ActRowLike> = {}): ActRowLike => ({
  id: '1',
  vali: { data: { id: '10' } },
  my: { data: [] },
  mesimabetahaliches: { data: [] },
  tafkidims: { data: [] },
  ...over
});

const withAssignee = (over: Partial<ActRowLike> = {}) =>
  bare({ isAssigned: true, my: { data: [{ id: '20' }] }, ...over });

describe('getActStatus', () => {
  it('is unassigned when nobody and nothing is attached', () => {
    expect(getActStatus(bare())).toBe('unassigned');
  });

  it('is published when linked to a mission but nobody took it', () => {
    expect(getActStatus(bare({ pendm: { data: { id: '5' } } }))).toBe('published');
    expect(getActStatus(bare({ open_mission: { data: { id: '5' } } }))).toBe('published');
    expect(getActStatus(bare({ mesimabetahaliches: { data: [{ id: '5' }] } }))).toBe('published');
  });

  it('is pendingApproval while the assignee has not accepted', () => {
    expect(getActStatus(withAssignee({ myIshur: false }))).toBe('pendingApproval');
  });

  it('is inProgress once the assignee accepted', () => {
    expect(getActStatus(withAssignee({ myIshur: true }))).toBe('inProgress');
  });

  it('is pendingValidation when done but not yet validated', () => {
    expect(getActStatus(withAssignee({ myIshur: true, naasa: true }))).toBe('pendingValidation');
  });

  it('is completed once the validator signed off', () => {
    expect(getActStatus(withAssignee({ myIshur: true, naasa: true, valiIshur: true }))).toBe(
      'completed'
    );
  });

  it('lets naasa outrank the assignment booleans it leaves behind', () => {
    // A finished act still carries isAssigned/myIshur from earlier in its life;
    // reading those first would report it as inProgress forever.
    const done = withAssignee({ isAssigned: true, myIshur: true, naasa: true, valiIshur: true });
    expect(getActStatus(done)).toBe('completed');
  });

  it('treats a null/undefined row as unassigned rather than throwing', () => {
    expect(getActStatus(null)).toBe('unassigned');
    expect(getActStatus(undefined)).toBe('unassigned');
  });

  it('lets an explicit isAssigned:false win over a lingering my relation', () => {
    // Handing an act back clears the assignment; if the relation write does
    // not land, the row must still read as free rather than staying stuck on
    // someone who already said no.
    const handedBack = withAssignee({ isAssigned: false, myIshur: false });
    expect(getActStatus(handedBack)).toBe('unassigned');
  });

  it('still reads the relation on legacy rows that never set isAssigned', () => {
    const legacy = bare({ my: { data: [{ id: '20' }] }, myIshur: true });
    expect(legacy.isAssigned).toBeUndefined();
    expect(getActStatus(legacy)).toBe('inProgress');
  });
});

describe('placement helpers', () => {
  it('hasAssignee follows my.data', () => {
    expect(hasAssignee(bare())).toBe(false);
    expect(hasAssignee(withAssignee())).toBe(true);
  });

  it('hasMissionLink covers all three relations', () => {
    expect(hasMissionLink(bare())).toBe(false);
    expect(hasMissionLink(bare({ pendm: { data: { id: '1' } } }))).toBe(true);
    expect(hasMissionLink(bare({ open_mission: { data: { id: '1' } } }))).toBe(true);
    expect(hasMissionLink(bare({ mesimabetahaliches: { data: [{ id: '1' }] } }))).toBe(true);
  });

  it('isAwaitingPlacement is exactly the take-it/publish lane', () => {
    expect(isAwaitingPlacement(bare())).toBe(true);
    expect(isAwaitingPlacement(withAssignee())).toBe(false);
    expect(isAwaitingPlacement(bare({ pendm: { data: { id: '1' } } }))).toBe(false);
  });

  it('does not treat an empty relation object as a link', () => {
    expect(hasMissionLink(bare({ pendm: { data: null }, open_mission: { data: null } }))).toBe(
      false
    );
  });
});

describe('getActProgress', () => {
  it('forces 100 for done lanes regardless of the stored number', () => {
    expect(getActProgress(withAssignee({ naasa: true, status: 40 }))).toBe(100);
    expect(getActProgress(withAssignee({ naasa: true, valiIshur: true, status: 0 }))).toBe(100);
  });

  it('forces 0 for lanes where no work has started', () => {
    expect(getActProgress(bare({ status: 55 }))).toBe(0);
    expect(getActProgress(bare({ pendm: { data: { id: '1' } }, status: 55 }))).toBe(0);
  });

  it('clamps a stored value into 0..100', () => {
    expect(getActProgress(withAssignee({ myIshur: true, status: 42 }))).toBe(42);
    expect(getActProgress(withAssignee({ myIshur: true, status: 250 }))).toBe(100);
    expect(getActProgress(withAssignee({ myIshur: true, status: -8 }))).toBe(0);
  });

  it('survives a non-numeric status', () => {
    expect(getActProgress(withAssignee({ myIshur: true, status: NaN }))).toBe(0);
  });
});

describe('getQuickActions', () => {
  it('offers approve only to the assignee, and only before acceptance', () => {
    const row = withAssignee({ myIshur: false });
    expect(getQuickActions(row, '20')).toContain('approve');
    expect(getQuickActions(row, '99')).not.toContain('approve');
    expect(getQuickActions(withAssignee({ myIshur: true }), '20')).not.toContain('approve');
  });

  it('pairs approve with decline, so an assignment is never a one-way door', () => {
    const row = withAssignee({ myIshur: false });
    expect(getQuickActions(row, '20')).toEqual(['approve', 'decline']);
  });

  it('offers decline to nobody but the assignee', () => {
    const row = withAssignee({ myIshur: false });
    expect(getQuickActions(row, '10')).not.toContain('decline'); // the creator
    expect(getQuickActions(row, '99')).not.toContain('decline'); // a bystander
  });

  it('offers progress and done to the doer once work is under way', () => {
    const row = withAssignee({ myIshur: true });
    expect(getQuickActions(row, '20')).toEqual(['progress', 'done']);
  });

  it('offers progress and done to nobody else', () => {
    const row = withAssignee({ myIshur: true });
    expect(getQuickActions(row, '10')).toEqual([]);
    expect(getQuickActions(row, '99')).toEqual([]);
  });

  it('stops offering progress and done once the work is reported', () => {
    const row = withAssignee({ myIshur: true, naasa: true });
    expect(getQuickActions(row, '20')).not.toContain('done');
    expect(getQuickActions(row, '20')).not.toContain('progress');
  });

  it('leaves a completed act with no actions at all', () => {
    const row = withAssignee({ myIshur: true, naasa: true, valiIshur: true });
    expect(getQuickActions(row, '20')).toEqual([]);
    expect(getQuickActions(row, '10')).toEqual([]);
  });

  it('offers validate only to the creator, and only once work is reported done', () => {
    const row = withAssignee({ myIshur: true, naasa: true });
    expect(getQuickActions(row, '10')).toContain('validate');
    expect(getQuickActions(row, '20')).not.toContain('validate');
  });

  it('offers take and publish on an unplaced act', () => {
    expect(getQuickActions(bare(), '77')).toEqual(['take', 'publish']);
  });

  it('offers nothing to place an act that is already linked to a mission', () => {
    expect(getQuickActions(bare({ pendm: { data: { id: '1' } } }), '77')).toEqual([]);
  });

  it('matches ids across the string/number split Strapi queries produce', () => {
    // page.data.uid arrives as a number on some routes and a string on others;
    // `1 !== '1'` used to hide the approve button from the person who owns it.
    const row = withAssignee({ myIshur: false, my: { data: [{ id: 20 }] } });
    expect(getQuickActions(row, '20')).toContain('approve');
    expect(getQuickActions(withAssignee({ myIshur: false }), 20)).toContain('approve');
  });

  it('offers nothing to a signed-out viewer', () => {
    expect(getQuickActions(bare(), null)).toEqual([]);
    expect(getQuickActions(bare(), '')).toEqual([]);
  });
});
