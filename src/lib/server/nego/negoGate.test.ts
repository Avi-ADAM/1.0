import { describe, it, expect } from 'vitest';
import { computeNegoGate } from './negoGate';

const memberIds = ['1', '2', '3'];

describe('computeNegoGate — takerApplied (assigned offers)', () => {
  it('baseline application (taker applied) is still auto-approvable on a member yes', () => {
    const gate = computeNegoGate({
      rounds: [],
      vots: [{ what: true, order: 0, users_permissions_user: '1' }],
      takerId: '9', // external candidate who applied
      memberIds,
    });
    expect(gate.takerYes).toBe(true);
    expect(gate.approvable).toBe(true);
  });

  it('assigned offer (takerApplied:false) is NOT approvable on the assigner yes alone', () => {
    // createMission branch 2: creator (member 1) assigns the mission to member 2
    // and pre-casts their own yes. Member 2 stays silent → no consent.
    const gate = computeNegoGate({
      rounds: [],
      vots: [{ what: true, order: 0, users_permissions_user: '1' }],
      takerId: '2',
      memberIds,
      takerApplied: false,
    });
    expect(gate.takerYes).toBe(false);
    expect(gate.approvable).toBe(false);
  });

  it('assigned offer becomes approvable once the assignee votes yes', () => {
    const gate = computeNegoGate({
      rounds: [],
      vots: [
        { what: true, order: 0, users_permissions_user: '1' },
        { what: true, order: 0, users_permissions_user: '2' },
      ],
      takerId: '2',
      memberIds,
      takerApplied: false,
    });
    expect(gate.takerYes).toBe(true);
    expect(gate.approvable).toBe(true);
  });

  it("assignee's own counter round counts as their consent (needs a member yes at ≥L)", () => {
    const gate = computeNegoGate({
      rounds: [{ ordern: 1, proposedBy: 'candidate' }],
      vots: [
        { what: true, order: 0, users_permissions_user: '1' }, // stale — below L
        { what: true, order: 1, users_permissions_user: '3' }, // member re-approved
      ],
      takerId: '2',
      memberIds,
      takerApplied: false,
    });
    expect(gate.takerYes).toBe(true);
    expect(gate.approvable).toBe(true);
  });

  it('a member no still blocks an assigned offer even after assignee consent', () => {
    const gate = computeNegoGate({
      rounds: [],
      vots: [
        { what: true, order: 0, users_permissions_user: '1' },
        { what: true, order: 0, users_permissions_user: '2' },
        { what: false, order: 0, users_permissions_user: '3' },
      ],
      takerId: '2',
      memberIds,
      takerApplied: false,
    });
    expect(gate.approvable).toBe(false);
  });
});
