import { describe, expect, it } from 'vitest';
import { acceptRoleRules, acceptShownRoleRules, loadRoleRules, type Run } from './roleRules';
import { ruleTermLines } from '$lib/fulfillment/ruleTerms';

const rel = (id: string | null, attributes: Record<string, unknown> = {}) => ({ data: id ? { id, attributes } : null });
const many = (ids: string[]) => ({ data: ids.map((id) => ({ id })) });

function step(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    attributes: {
      name: `rule ${id}`,
      target: 'role',
      tafkidim: rel('30', { roleDescription: 'שליח' }),
      consentState: 'active',
      consentedBy: many(['7']),
      archived: false,
      per: 'order',
      effect: 'markShipped',
      when: { event: 'order.paid', deliveryPreference: ['delivery'] },
      proposedBy: rel('1', { username: 'דנה' }),
      ...over
    }
  };
}

function harness(nodes: any[] | Error) {
  const writes: { id: string; consentedBy: string[] }[] = [];
  const run: Run = async (qid, vars) => {
    if (qid === 'fulfillmentSteps') {
      if (nodes instanceof Error) throw nodes;
      return { data: { fulfillmentSteps: { data: nodes } } };
    }
    if (qid === 'fulfillmentStepUpdate') {
      writes.push({ id: String(vars.id), consentedBy: (vars.data as any).consentedBy });
      return {};
    }
    if (qid === '51GetOpenMissionById') {
      return { data: { openMission: { data: { attributes: { tafkidims: { data: [{ id: '30' }] } } } } } };
    }
    throw new Error(`unexpected qid ${qid}`);
  };
  return { run, writes };
}

const RULES = () => [
  step('1'),
  step('2', { tafkidim: rel('31') }), // another role
  step('3', { consentState: 'paused' }),
  step('4', { archived: true }),
  step('5', { target: 'member', tafkidim: rel(null) }),
  step('6', { consentState: 'proposed' })
];

describe('loadRoleRules — what comes with the mission’s roles', () => {
  it('only live rules that land on one of these roles', async () => {
    const { run } = harness(RULES());
    const rules = await loadRoleRules(run, { projectId: '57', roleIds: ['30'] });
    expect(rules.map((r) => r.stepId)).toEqual(['1', '6']);
    expect(rules[0]).toMatchObject({ name: 'rule 1', roleName: 'שליח', effect: 'markShipped' });
  });

  it('no roles, or the collection not deployed: nothing to show', async () => {
    expect(await loadRoleRules(harness(RULES()).run, { projectId: '57', roleIds: [] })).toEqual([]);
    expect(await loadRoleRules(harness(new Error('not deployed')).run, { projectId: '57', roleIds: ['30'] })).toEqual([]);
  });

  it('the terms speak of the role, not of "you" — the candidate does not hold it yet', () => {
    const lines = ruleTermLines({ ...step('1').attributes, target: 'role', roleName: 'שליח', missionName: null, dueHours: null, batching: 'perOrder', waveAt: null, routing: 'single', per: 'order', effect: 'markShipped' } as any, 'other');
    expect(lines.map((l) => l.key)).toContain('lev.fulfillRule.targetOther.role');
    expect(lines.map((l) => l.key)).not.toContain('lev.fulfillRule.target.role');
  });
});

describe('acceptRoleRules — applying says yes to what the page showed', () => {
  it('adds the applicant to the rules they were shown', async () => {
    const t = harness(RULES());
    const out = await acceptRoleRules(t.run, { projectId: '57', userId: '9', roleIds: ['30'], ruleIds: ['1', '6'] });
    expect(out).toEqual(['1', '6']);
    expect(t.writes).toEqual([
      { id: '1', consentedBy: ['7', '9'] },
      { id: '6', consentedBy: ['7', '9'] }
    ]);
  });

  it('a stale or forged id adds nothing: another role, paused, archived, not a role rule', async () => {
    const t = harness(RULES());
    const out = await acceptRoleRules(t.run, { projectId: '57', userId: '9', roleIds: ['30'], ruleIds: ['2', '3', '4', '5', '99'] });
    expect(out).toEqual([]);
    expect(t.writes).toEqual([]);
  });

  it('an existing yes is not written twice', async () => {
    const t = harness(RULES());
    expect(await acceptRoleRules(t.run, { projectId: '57', userId: '7', roleIds: ['30'], ruleIds: ['1'] })).toEqual(['1']);
    expect(t.writes).toEqual([]);
  });

  it('no ids (a heart suggestion, an agent) or a failure: nothing — the heart card asks instead', async () => {
    const t = harness(RULES());
    expect(await acceptShownRoleRules(t.run, '9', { projectId: '57', openMissionId: '5', ruleIds: undefined })).toEqual([]);
    expect(await acceptRoleRules(harness(new Error('down')).run, { projectId: '57', userId: '9', roleIds: ['30'], ruleIds: ['1'] })).toEqual([]);
  });

  it('reads the roles from the open mission when the caller does not have them', async () => {
    const t = harness(RULES());
    expect(await acceptShownRoleRules(t.run, '9', { projectId: '57', openMissionId: '5', ruleIds: ['1'] })).toEqual(['1']);
  });
});
