import { describe, it, expect } from 'vitest';
import { askmSpId, askmTakerApplied } from './askmAssigned';
import { computeNegoGate } from './negoGate';

describe('askmAssigned', () => {
  it('reads the sp id in every shape a read returns it', () => {
    expect(askmSpId({ sp: { data: { id: '7' } } })).toBe('7');
    expect(askmSpId({ sp: { id: 7 } })).toBe('7');
    expect(askmSpId({ sp: 7 })).toBe('7');
    expect(askmSpId({ sp: { data: null } })).toBeNull();
    expect(askmSpId({})).toBeNull();
    expect(askmSpId(null)).toBeNull();
  });

  it('an askm without an sp was offered to its taker, not asked for', () => {
    expect(askmTakerApplied({ sp: { data: null } })).toBe(false);
    expect(askmTakerApplied({ sp: { data: { id: '3' } } })).toBe(true);
  });

  it("the creator's yes is not the assignee's: silence never approves it", () => {
    const base = {
      rounds: [],
      vots: [{ what: true, users_permissions_user: '1', order: 0 }],
      takerId: '2',
      memberIds: ['1', '2']
    };
    const assigned = computeNegoGate({ ...base, takerApplied: askmTakerApplied({ sp: { data: null } }) });
    expect(assigned.takerYes).toBe(false);
    expect(assigned.approvable).toBe(false);

    const answered = computeNegoGate({
      ...base,
      vots: [...base.vots, { what: true, users_permissions_user: '2', order: 0 }],
      takerApplied: askmTakerApplied({ sp: { data: { id: '9' } } })
    });
    expect(answered.takerYes).toBe(true);
  });
});
