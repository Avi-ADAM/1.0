import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openMissionProposalHandler } from './proposeOnOpenMission';
import { proposeOnOpenMissionConfig } from './proposeOnOpenMission';
import { customizeOpenMissionConfig } from './customizeOpenMission';
import { applyToMissionConfig } from './applyToMission';
import type { ActionExecutionHandler } from '../types';

/**
 * QA_CONCIERGE_E2E C-9 — a community member taking a need a wish published, "on
 * their own terms". The open mission has no rikma, and the customize path asked
 * Strapi for the members of project "" and died with a 500, silently, with the
 * dialog left open. It now puts the volunteer's terms in front of the wisher.
 */

const WISHER = '10';
const VOLUNTEER = '30';

function world(opts: { ratson?: boolean } = {}) {
  const calls: { qid: string; vars: any }[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      switch (qid) {
        case '51GetOpenMissionById':
          return {
            data: {
              openMission: {
                data: {
                  attributes: {
                    name: 'הרכבת מחשב',
                    noofhours: 4,
                    perhour: 150,
                    ratson: { data: opts.ratson === false ? null : { id: '16' } }
                  }
                }
              }
            }
          };
        case 'getOpenMissionExtractedKey':
          return { data: { openMission: { data: { attributes: { extractedKey: 'em-2' } } } } };
        case '105queryRatsonWithProposals':
          return {
            data: {
              ratson: {
                data: {
                  id: '16',
                  attributes: {
                    users_permissions_users: { data: [{ id: WISHER }] },
                    extracted_missions: [{ id: 'em-1', name: 'נגרות' }, { id: 'em-2', name: 'הרכבת מחשב' }]
                  }
                }
              }
            }
          };
        case '101createRatsonProposal':
          return { data: { createRatsonProposal: { data: { id: '77' } } } };
        case '80usersPermissionsUserWithAskeds':
          return { data: { usersPermissionsUser: { data: { attributes: { askeds: { data: [] } } } } } };
        default:
          return { data: {} };
      }
    })
  };
  const notifier = { notify: vi.fn(async () => ({})) };
  return { calls, strapi, notifier };
}

const ctx = { userId: VOLUNTEER, jwt: 'jwt', fetch: (() => {}) as any } as any;
const run = (handler: ActionExecutionHandler, w: ReturnType<typeof world>, params: Record<string, unknown>) =>
  handler(params, ctx, { strapi: w.strapi, notifier: w.notifier } as any);

describe('a need a wish published to the community, taken on terms of their own', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('no longer asks Strapi for the members of a project that does not exist', async () => {
    const w = world();
    await run(openMissionProposalHandler, w, {
      openMissionId: '9',
      newValues: { noofhours: 6, perhour: 113, hearotMeyuchadot: 'הרכבה כוללת בדיקות' }
    });
    expect(w.calls.some((c) => c.qid === '128getProjectMembersAndRestime')).toBe(false);
    expect(w.calls.some((c) => c.qid === '81.5createAsk')).toBe(false); // there is no rikma to vote
  });

  it('puts the volunteer’s terms in front of the wisher as a proposal, and logs them as a first counter', async () => {
    const w = world();
    const out: any = await run(openMissionProposalHandler, w, {
      openMissionId: '9',
      newValues: { noofhours: 6, perhour: 113, hearotMeyuchadot: 'הרכבה כוללת בדיקות' }
    });

    expect(out.data).toMatchObject({ proposalId: '77', ratsonId: '16', countered: true });
    const created = w.calls.find((c) => c.qid === '101createRatsonProposal')!.vars;
    expect(created).toMatchObject({ ratson: '16', kind: 'custom_offer', open_mission: '9', total_price: 678 });
    expect(created.proposer_users).toEqual([VOLUNTEER]);
    // bound to the extracted need it came from, at the volunteer's hours and price
    expect(created.covered_missions).toEqual([{ extracted_mission_idx: 'em-2', hours: 6, price: 678 }]);

    const logged = w.calls.find((c) => c.qid === '387counterRatsonProposal')!.vars;
    expect(logged.id).toBe('77');
    expect(logged.ratson_willingness_entry[0]).toMatchObject({
      user: VOLUNTEER,
      agree: false,
      willingHours: 6,
      willingAmount: 678,
      note: 'הרכבה כוללת בדיקות'
    });
  });

  it('tells the wisher the terms are not the published ones', async () => {
    const w = world();
    await run(openMissionProposalHandler, w, { openMissionId: '9', newValues: { noofhours: 6, perhour: 113 } });
    const [config, , result] = w.notifier.notify.mock.calls[0] as any;
    expect(result.recipientIds).toEqual([WISHER]);
    expect(config.templates.title.he).toContain('תנאים אחרים');
    expect(config.metadata.url).toBe('/concierge/16');
  });

  it('on the published terms it is the plain volunteer offer: nothing to log', async () => {
    const w = world();
    const out: any = await run(openMissionProposalHandler, w, {
      openMissionId: '9',
      newValues: { noofhours: 4, perhour: 150 }
    });
    expect(out.data.countered).toBe(false);
    expect(w.calls.some((c) => c.qid === '387counterRatsonProposal')).toBe(false);
    const created = w.calls.find((c) => c.qid === '101createRatsonProposal')!.vars;
    expect(created.covered_missions).toEqual([{ extracted_mission_idx: 'em-2', hours: 4, price: 600 }]);
    const [config] = w.notifier.notify.mock.calls[0] as any;
    expect(config.templates.title.he).toContain('מתנדב/ת חדש/ה');
  });

  it('a mission with no rikma and no wish behind it is refused in words', async () => {
    const w = world({ ratson: false });
    await expect(run(openMissionProposalHandler, w, { openMissionId: '9', newValues: {} })).rejects.toThrow(
      /no project and no linked wish/
    );
  });

  it('applyToMission — the one-click path — still gives the same plain offer', async () => {
    const w = world();
    const out: any = await run(applyToMissionConfig.graphqlOperation as ActionExecutionHandler, w, { openMissionId: '9' });
    expect(out.data).toMatchObject({ proposalId: '77', ratsonId: '16', concierge: true, countered: false });
    expect(w.calls.find((c) => c.qid === '101createRatsonProposal')!.vars.total_price).toBe(600);
  });

  it('is reachable without a project id, by either key', () => {
    expect(proposeOnOpenMissionConfig.paramSchema.projectId.required).toBe(false);
    expect(customizeOpenMissionConfig.paramSchema.projectId.required).toBe(false);
  });
});
