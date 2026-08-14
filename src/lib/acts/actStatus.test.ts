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
