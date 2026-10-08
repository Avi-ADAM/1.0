import { describe, expect, it, vi } from 'vitest';
import { fillOfferIntoDeal, loadCandidacyDeal, readOfferDeal } from './offerDeal';
import { computeNegoGate } from '$lib/server/nego/negoGate';
import { evaluateAskAcceptance } from '$lib/server/nego/askAcceptance';

/**
 * QA_CONCIERGE_E2E C-19 — a part of a customer's deal still open in the rikma is co-signed
 * by her: whatever it ends on is added to what she pays.
 */

const sale = (id: string, clients: string[], over: Record<string, unknown> = {}) => ({
  id,
  attributes: {
    archived: false,
    quant: 1,
    total: 1800,
    project: { data: { id: '91' } },
    users_permissions_users: { data: clients.map((c) => ({ id: c })) },
    ...over
  }
});

function missionOffer(opts: { project?: string | null; assigned?: string | null; sales?: any[] } = {}) {
  return {
    id: '300',
    attributes: {
      name: 'Repair the laptop',
      noofhours: 4,
      perhour: 100,
      archived: false,
      project: { data: opts.project === null ? null : { id: opts.project ?? '91' } },
      pendm: {
        data: {
          id: '50',
          attributes: {
            matanot_recipe_missions: {
              data: [
                {
                  id: '70',
                  attributes: {
                    hoursPerUnit: 4,
                    ratePerHour: 100,
                    unitsPerProduct: 1,
                    assignedMember: { data: opts.assigned ? { id: opts.assigned } : null },
                    matanot: { data: { id: '48', attributes: { name: 'The wish', sheiruts: { data: opts.sales ?? [sale('8', ['261'])] } } } }
                  }
                }
              ]
            }
          }
        }
      }
    }
  };
}

describe('readOfferDeal — which deal an offer fills, and who pays', () => {
  it('an unassigned line of a sold product: its customers sign', () => {
    const d = readOfferDeal('mission', missionOffer())!;
    expect(d).toMatchObject({
      offerId: '300',
      projectId: '91',
      lineId: '70',
      matanotId: '48',
      plannedPrice: 400,
      offerAmount: 4,
      offerUnitPrice: 100,
      clientIds: ['261']
    });
  });

  it('an ordinary open mission, or a published need before the wish closed, is no deal', () => {
    const plain = { id: '1', attributes: { project: { data: { id: '91' } }, pendm: { data: null } } };
    expect(readOfferDeal('mission', plain)).toBeNull();
    expect(readOfferDeal('mission', missionOffer({ project: null }))).toBeNull();
  });

  it('a line someone already holds is not a gap', () => {
    expect(readOfferDeal('mission', missionOffer({ assigned: '256' }))).toBeNull();
  });

  it('only the deals of this rikma that are still live count — product-scoped, multi-customer ready', () => {
    const d = readOfferDeal(
      'mission',
      missionOffer({
        sales: [
          sale('8', ['261']),
          sale('9', ['262', '261']),
          sale('10', ['300'], { archived: true }),
          sale('11', ['301'], { project: { data: { id: '92' } } })
        ]
      })
    )!;
    expect(d.sales.map((s) => s.sheirutId)).toEqual(['8', '9']);
    expect(d.clientIds.sort()).toEqual(['261', '262']);
  });

  it('a read error is not "nobody pays" — it throws', async () => {
    const run = vi.fn().mockResolvedValue({ errors: [{ message: 'Forbidden' }] });
    await expect(loadCandidacyDeal(run, 'ask', '5')).rejects.toThrow(/Could not read the deal/);
    const empty = vi.fn().mockResolvedValue(undefined);
    await expect(loadCandidacyDeal(empty, 'ask', '5')).resolves.toBeNull();
  });
});

describe('the customer signs: the gate', () => {
  const base = { rounds: [], takerId: '400', memberIds: ['256', '258'] };
  const yes = (u: string, order = 0) => ({ what: true, order, users_permissions_user: u });

  it('the rikma and the candidate agreeing is not enough while she has not signed', () => {
    const g = computeNegoGate({ ...base, vots: [yes('256')], clientIds: ['261'] });
    expect(g).toMatchObject({ hasPMyes: true, takerYes: true, clientYes: false, approvable: false, clientsPending: ['261'] });
    expect(computeNegoGate({ ...base, vots: [yes('256'), yes('261')], clientIds: ['261'] }).approvable).toBe(true);
  });

  it('her yes counts only for the standing round — a counter asks her again', () => {
    const g = computeNegoGate({
      ...base,
      rounds: [{ ordern: 1, proposedBy: 'candidate' }],
      vots: [yes('261', 0), yes('256', 1)],
      clientIds: ['261']
    });
    expect(g.clientYes).toBe(false);
  });

  it('every customer of the deal signs, and an ordinary offer has none to wait for', () => {
    expect(computeNegoGate({ ...base, vots: [yes('256'), yes('261')], clientIds: ['261', '262'] }).clientsPending).toEqual(['262']);
    expect(computeNegoGate({ ...base, vots: [yes('256')] })).toMatchObject({ clientYes: true, approvable: true });
  });

  it("a member's approve keeps her vote and waits for the customer", () => {
    const askAttributes = {
      vots: [],
      users_permissions_user: { data: { id: '400' } },
      open_mission: { data: { attributes: { isRishon: false } } },
      project: { data: { attributes: { user_1s: { data: [{ id: '256' }] } } } },
      negopendmissions: { data: [] }
    };
    const check = evaluateAskAcceptance({ askAttributes, callerId: '256', clientIds: ['261'] });
    expect(check).toMatchObject({ allowed: false, reason: 'awaitingClientConsent' });
    expect(check.vots.map((v) => v.users_permissions_user)).toEqual(['256']);
    expect(evaluateAskAcceptance({ askAttributes, callerId: '256' }).allowed).toBe(true);
  });
});

describe('fillOfferIntoDeal — a taken gap joins the deal', () => {
  it('puts the taker on the line at the signed terms and grows each deal; "paid" falls back', async () => {
    const run = vi.fn().mockResolvedValue({ data: {} });
    const d = readOfferDeal('mission', missionOffer())!;
    const out = await fillOfferIntoDeal(run, d, { takerId: '400', amount: 5, unitPrice: 120, mesimabetahalichId: '900' });
    expect(out).toEqual({ filled: true, added: 600 });
    expect(run).toHaveBeenCalledWith('414fillRecipeMission', {
      id: '70',
      data: { assignedMember: '400', hoursPerUnit: 5, ratePerHour: 120, unitsPerProduct: 1, mesimabetahalich: '900' }
    });
    expect(run).toHaveBeenCalledWith('213updateSheirut', { id: '8', data: { total: 2400, price: 2400, moneyTransfered: false } });
  });

  it('never throws: the mission already exists', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const run = vi.fn().mockResolvedValue({ errors: [{ message: 'nope' }] });
    const out = await fillOfferIntoDeal(run, readOfferDeal('mission', missionOffer())!, { takerId: '400', amount: 1, unitPrice: 1 });
    expect(out.filled).toBe(false);
  });
});
