import { describe, it, expect } from 'vitest';
import { bindStipendFunder, readStipendRequest } from './bindFunder.js';

/**
 * The rule these tests exist for (PLAN_STIPEND §15): a stipend funding request
 * that somebody takes must bind them to the programme, and must **not** leave
 * the generic recurring-resource machinery to invent a second engine with a
 * typed monthly amount. The acceptance path branches on `readStipendRequest`,
 * so both halves of that answer have to be right.
 */

type Reply = (query: string) => any;

function fakeExec(opts: {
  source?: string | null;
  programId?: string | null;
  programFunder?: string | null;
  programStatus?: string;
  pledges?: Array<{ id: string; funder?: string | null; recipient?: string | null; status?: string }>;
} = {}) {
  const sent: string[] = [];
  const {
    source = 'stipend',
    programId = '9',
    programFunder = null,
    programStatus = 'active',
    pledges = [{ id: '77', funder: null, recipient: '5', status: 'proposed' }]
  } = opts;

  const reply: Reply = (query) => {
    if (query.includes('openMashaabim(id:')) {
      return {
        data: {
          openMashaabim: {
            data: {
              attributes: {
                source,
                stipend_program: programId ? { data: { id: programId } } : { data: null }
              }
            }
          }
        }
      };
    }
    if (query.includes('stipendProgram(id:')) {
      return {
        data: {
          stipendProgram: {
            data: {
              id: programId,
              attributes: {
                name: 'מלגת קיום לאורי',
                mode: 'equity',
                costShare: 1,
                equityMultiplier: 1,
                stipendRate: 50,
                totalCap: 6000,
                monthlyCap: null,
                spent: 0,
                status: programStatus,
                seekingFunder: !programFunder,
                project: { data: { id: '45' } },
                funder: programFunder ? { data: { id: programFunder } } : { data: null }
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
            data: pledges.map((p) => ({
              id: p.id,
              attributes: {
                mode: 'equity',
                costShare: 1,
                equityMultiplier: 1,
                stipendRate: 50,
                cycleSize: 1,
                status: p.status ?? 'proposed',
                project: { data: { id: '45' } },
                stipend_program: { data: { id: programId } },
                funder: p.funder ? { data: { id: p.funder } } : { data: null },
                recipient: p.recipient ? { data: { id: p.recipient } } : { data: null },
                mashabetahalich: { data: null },
                mesimabetahaliches: { data: [] },
                open_missions: { data: [] }
              }
            }))
          }
        }
      };
    }
    if (query.includes('stipendPledge(id:')) {
      return { data: { stipendPledge: { data: { attributes: { mashabetahalich: null } } } } };
    }
    if (query.includes('createMashabetahalich')) {
      return { data: { createMashabetahalich: { data: { id: '500' } } } };
    }
    return { data: {} };
  };

  const exec = async (query: string) => {
    sent.push(query);
    return reply(query);
  };
  return { exec, sent };
}

describe('readStipendRequest', () => {
  it('recognises a funding request by its source', async () => {
    const { exec } = fakeExec();
    expect(await readStipendRequest(exec as any, '3')).toEqual({
      isStipendRequest: true,
      programId: '9'
    });
  });

  it('leaves an ordinary open resource alone', async () => {
    const { exec } = fakeExec({ source: null, programId: null });
    expect(await readStipendRequest(exec as any, '3')).toEqual({
      isStipendRequest: false,
      programId: null
    });
  });
});

describe('bindStipendFunder', () => {
  it('names the funder on the programme and stops it seeking one', async () => {
    const { exec, sent } = fakeExec();
    const res = await bindStipendFunder(exec as any, { openMashaabimId: '3', funderId: '12' });

    expect(res.bound).toBe(true);
    const programWrite = sent.find((q) => q.includes('updateStipendProgram')) ?? '';
    expect(programWrite).toContain('funder: "12"');
    expect(programWrite).toContain('seekingFunder: false');
  });

  it('starts a pledge that has a recipient, and builds it a stipend engine', async () => {
    const { exec, sent } = fakeExec();
    const res = await bindStipendFunder(exec as any, { openMashaabimId: '3', funderId: '12' });

    expect(res.pledgeIds).toEqual(['77']);
    expect(res.activatedPledgeIds).toEqual(['77']);
    const pledgeWrite = sent.find((q) => q.includes('updateStipendPledge(id: "77"')) ?? '';
    expect(pledgeWrite).toContain('funder: "12"');
    expect(pledgeWrite).toContain('status: active');
    // The engine is the pledge's life-cycle carrier and must be marked, or the
    // monthly sweep opens a typed-amount Maap on it (PLAN_STIPEND §15).
    const engine = sent.find((q) => q.includes('createMashabetahalich')) ?? '';
    expect(engine).toContain('isStipend: true');
    expect(engine).toContain('users_permissions_user: "12"');
  });

  it('leaves a pledge that still has no recipient `proposed`', async () => {
    const { exec, sent } = fakeExec({
      pledges: [{ id: '78', funder: null, recipient: null, status: 'proposed' }]
    });
    const res = await bindStipendFunder(exec as any, { openMashaabimId: '3', funderId: '12' });

    expect(res.activatedPledgeIds).toEqual([]);
    const pledgeWrite = sent.find((q) => q.includes('updateStipendPledge(id: "78"')) ?? '';
    expect(pledgeWrite).toContain('funder: "12"');
    expect(pledgeWrite).not.toContain('status: active');
    expect(sent.some((q) => q.includes('createMashabetahalich'))).toBe(false);
  });

  it('does not reassign a pledge that already names a different funder', async () => {
    const { exec, sent } = fakeExec({
      pledges: [{ id: '79', funder: '4', recipient: '5', status: 'active' }]
    });
    const res = await bindStipendFunder(exec as any, { openMashaabimId: '3', funderId: '12' });

    expect(res.pledgeIds).toEqual([]);
    expect(sent.some((q) => q.includes('updateStipendPledge'))).toBe(false);
  });

  it('does nothing at all for an ordinary open resource', async () => {
    const { exec, sent } = fakeExec({ source: null, programId: null });
    const res = await bindStipendFunder(exec as any, { openMashaabimId: '3', funderId: '12' });

    expect(res.bound).toBe(false);
    expect(sent.some((q) => q.includes('updateStipendProgram'))).toBe(false);
  });
});
