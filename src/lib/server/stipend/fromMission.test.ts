import { describe, it, expect } from 'vitest';
import { carryStipendToMission } from './fromMission.js';

/**
 * What these tests protect (PLAN_STIPEND §6, §13): a stipend agreed on an
 * **open** mission is payable only once the pledge holds the
 * `mesimabetahalich` link, because approved hours hang off that row and
 * nowhere else. The moment the work is taken, the waiting pledge must be
 * claimed — not duplicated, and not left pointing at the open mission.
 */
function fakeExec(opts: { waiting?: boolean; funder?: string | null; costShare?: number } = {}) {
  const { waiting = true, funder = '2', costShare = 0 } = opts;
  const sent: string[] = [];

  const exec = async (query: string) => {
    sent.push(query);

    if (query.includes('openMission(id:')) {
      return {
        data: {
          openMission: {
            data: {
              attributes: {
                stipendRate: 20,
                stipendCostShare: costShare,
                stipendMode: 'equity',
                stipendFunder: funder ? { data: { id: funder } } : null
              }
            }
          }
        }
      };
    }

    if (query.includes('stipendPledges(filters:')) {
      return {
        data: {
          stipendPledges: {
            data: waiting
              ? [
                  {
                    id: '77',
                    attributes: {
                      mode: 'equity',
                      costShare: 0,
                      equityMultiplier: 1,
                      stipendRate: 20,
                      totalCap: 6000,
                      descrip: 'QA',
                      funder: funder ? { data: { id: funder } } : null,
                      stipend_program: { data: { id: '9' } }
                    }
                  }
                ]
              : []
          }
        }
      };
    }

    if (query.includes('project(id:')) {
      return {
        data: {
          project: {
            data: {
              id: '45',
              attributes: { projectName: 'r', restime: 'feh', user_1s: { data: [] } }
            }
          }
        }
      };
    }
    if (query.includes('createDecision')) {
      return { data: { createDecision: { data: { id: '600' } } } };
    }
    if (query.includes('createTimegrama')) {
      return { data: { createTimegrama: { data: { id: '700' } } } };
    }
    if (query.includes('createStipendPledge')) {
      return { data: { createStipendPledge: { data: { id: '88' } } } };
    }
    return { data: {} };
  };

  return { exec, sent };
}

const input = {
  projectId: '45',
  openMissionId: '231',
  mesimabetahalichId: '900',
  recipientId: '7',
  hours: 7,
  missionName: 'QA'
};

describe('carryStipendToMission', () => {
  it('claims the pledge that was waiting on the open mission', async () => {
    const { exec, sent } = fakeExec();
    const res = await carryStipendToMission(exec as any, input);

    expect(res.opened).toBe(true);
    expect(res.pledgeId).toBe('77');
    // No second pledge for the same work.
    expect(sent.some((q) => q.includes('createStipendPledge'))).toBe(false);

    const update = sent.find((q) => q.includes('updateStipendPledge')) ?? '';
    // The link that makes it payable at all: hours are metered on this row.
    expect(update).toContain('mesimabetahaliches: ["900"]');
    expect(update).toContain('recipient: "7"');
    // Still unsigned by the taker, so still proposed.
    expect(update).toContain('status: proposed');
    // …and the taker gets a decision to sign.
    expect(sent.some((q) => q.includes('createDecision'))).toBe(true);
  });

  it('falls back to opening a fresh pledge when nothing was waiting', async () => {
    // costShare 1 — the recipient carries it, so it dilutes nobody and needs no
    // programme above it. (A diluting one is refused; that is the next test.)
    const { exec, sent } = fakeExec({ waiting: false, costShare: 1 });
    const res = await carryStipendToMission(exec as any, input);

    expect(res.opened).toBe(true);
    expect(sent.some((q) => q.includes('createStipendPledge'))).toBe(true);
  });

  it('refuses to open a diluting pledge that no active programme covers', async () => {
    // A mission may advertise a need before the rikma agreed to be diluted for
    // it. Until an active programme covers the terms, nothing opens.
    const { exec, sent } = fakeExec({ waiting: false, costShare: 0 });
    const res = await carryStipendToMission(exec as any, input);

    expect(res.opened).toBe(false);
    expect(res.reason).toBe('needsProgram');
    expect(sent.some((q) => q.includes('createStipendPledge'))).toBe(false);
  });

  it('claims the pledge but opens nothing while no funder has committed', async () => {
    const { exec, sent } = fakeExec({ funder: null });
    const res = await carryStipendToMission(exec as any, input);

    expect(res.opened).toBe(false);
    expect(res.reason).toBe('noFunder');
    // The link is still made — the work is now attached to the stipend, and a
    // funder appearing later has something to fund.
    expect(sent.some((q) => q.includes('updateStipendPledge'))).toBe(true);
  });
});
