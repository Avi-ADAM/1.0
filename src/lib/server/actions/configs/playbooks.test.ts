import { describe, expect, it, vi } from 'vitest';
import { proposePlaybookUpdateConfig } from './playbooks.js';

type Db = { members: number; docs: any[]; open: any[] };

function strapiFor(db: Db) {
  const calls: Array<[string, any]> = [];
  const execute = vi.fn(async (qid: string, vars: any) => {
    calls.push([qid, vars]);
    switch (qid) {
      case 'getProjectBaseInfo':
        return { data: { project: { data: { attributes: { restime: 'feh', user_1s: { data: Array.from({ length: db.members }, (_, i) => ({ id: i + 1 })) } } } } } };
      case 'playbooksOfProject':
        return { data: { spaceDocs: { data: db.docs } } };
      case 'playbookOpenDecisions':
        return { data: { decisions: { data: db.open } } };
      case 'playbookCreate':
        return { data: { createSpaceDoc: { data: { id: 11 } } } };
      case 'playbookUpdate':
        return { data: { updateSpaceDoc: { data: { id: vars.id } } } };
      case 'playbookDecisionCreate':
        return { data: { createDecision: { data: { id: 60 } } } };
      default:
        return { data: {} };
    }
  });
  return { strapi: { execute }, calls };
}

const doc = (id: number, roleId: number | null, body = 'old') => ({
  id,
  attributes: { kind: 'playbook', archived: false, name: 'Sales', body, updatedAt: '2026-11-01', project: { data: { id: 103 } }, tafkidim: { data: roleId ? { id: roleId } : null } }
});

const run = (db: Db, p: Record<string, unknown>) => {
  const s = strapiFor(db);
  const out = (proposePlaybookUpdateConfig.graphqlOperation as any)({ projectId: '103', ...p }, { userId: '271', jwt: 'j', fetch: undefined }, { strapi: s.strapi });
  return { out, calls: s.calls };
};

describe('proposePlaybookUpdate', () => {
  it('a rikma of one writes directly', async () => {
    const { out, calls } = run({ members: 1, docs: [], open: [] }, { body: ' how we work ' });
    expect(await out).toEqual({ applied: true, docId: '11', decisionId: null });
    expect(calls.find((c) => c[0] === 'playbookCreate')![1].data).toMatchObject({ body: 'how we work', kind: 'playbook' });
    expect(calls.some((c) => c[0] === 'playbookDecisionCreate')).toBe(false);
  });

  it('a larger rikma opens a decision on the existing role playbook, signed by the proposer', async () => {
    const { out, calls } = run({ members: 3, docs: [doc(9, 5)], open: [] }, { roleId: '5', body: 'new rules' });
    expect(await out).toMatchObject({ applied: false, docId: '9', decisionId: '60' });
    const create = calls.find((c) => c[0] === 'playbookDecisionCreate')![1];
    expect(create).toMatchObject({ playbookDoc: '9', playbookRole: '5', newPlaybook: 'new rules', vots: [{ what: true, users_permissions_user: '271' }] });
    expect(calls.some((c) => c[0] === '32createTimeGrama')).toBe(true);
    expect(calls.some((c) => c[0] === 'playbookUpdate')).toBe(false);
  });

  it('a newer text replaces the open proposal for the same playbook and closes its clock', async () => {
    const openOne = {
      id: 40,
      attributes: { playbookDoc: { data: { id: 9 } }, playbookRole: { data: null }, timegrama: { data: { id: 77, attributes: { done: false } } }, vots: [] }
    };
    const other = { id: 41, attributes: { playbookDoc: { data: null }, playbookRole: { data: { id: 6 } }, vots: [] } };
    const { out, calls } = run({ members: 3, docs: [doc(9, null)], open: [openOne, other] }, { body: 'v2' });
    expect(await out).toMatchObject({ decisionId: '60', replaced: ['40'] });
    expect(calls.filter((c) => c[0] === 'playbookDecisionArchive').map((c) => c[1].id)).toEqual(['40']);
    expect(calls.find((c) => c[0] === '35updateTimeGrama')![1]).toEqual({ id: '77', done: true });
  });

  it('the same text is not proposed again', async () => {
    const { out } = run({ members: 3, docs: [doc(9, null, 'same')], open: [] }, { body: 'same' });
    expect(await out).toMatchObject({ unchanged: true, decisionId: null });
  });

  it('refuses an empty text', async () => {
    await expect(run({ members: 3, docs: [], open: [] }, { body: '   ' }).out).rejects.toThrow(/empty/);
  });
});
