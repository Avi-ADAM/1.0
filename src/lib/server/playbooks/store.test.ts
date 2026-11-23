import { describe, expect, it, vi } from 'vitest';
import { applyPlaybookDecision, writePlaybook } from './store';

const decision = (over: Record<string, unknown> = {}) => ({
  data: {
    decision: {
      data: {
        id: 40,
        attributes: {
          kind: 'playbook',
          archived: false,
          decisionName: 'Sales',
          newPlaybook: 'net+30',
          projects: { data: [{ id: 103 }] },
          playbookDoc: { data: null },
          playbookRole: { data: { id: 5 } },
          vots: [{ what: true, users_permissions_user: { data: { id: 271 } } }],
          ...over
        }
      }
    }
  }
});

const docNode = (projectId: number, over: Record<string, unknown> = {}) => ({
  id: 9,
  attributes: { kind: 'playbook', archived: false, name: 'Sales', body: 'old', project: { data: { id: projectId } }, tafkidim: { data: { id: 5 } }, ...over }
});

function runWith(dec: any, docs: any[] = []) {
  return vi.fn(async (qid: string, _vars: any) => {
    if (qid === 'playbookDecision') return dec;
    if (qid === 'playbooksOfProject') return { data: { spaceDocs: { data: docs } } };
    if (qid === 'playbookCreate') return { data: { createSpaceDoc: { data: { id: 11 } } } };
    if (qid === 'playbookUpdate') return { data: { updateSpaceDoc: { data: { id: 9 } } } };
    return {};
  });
}

describe('applyPlaybookDecision', () => {
  it('creates the role playbook, written by the proposer', async () => {
    const run = runWith(decision());
    const out = await applyPlaybookDecision(run, '40', '103');
    expect(out).toEqual({ applied: true, docId: '11', projectId: '103', roleId: '5' });
    const create = run.mock.calls.find((c) => c[0] === 'playbookCreate')![1];
    expect(create.data).toMatchObject({ project: '103', kind: 'playbook', body: 'net+30', tafkidim: '5', uploadedBy: '271' });
  });

  it('a slot that got a playbook meanwhile is updated, not doubled', async () => {
    const run = runWith(decision(), [docNode(103)]);
    const out = await applyPlaybookDecision(run, '40', '103');
    expect(out).toMatchObject({ applied: true, docId: '9' });
    expect(run.mock.calls.some((c) => c[0] === 'playbookCreate')).toBe(false);
  });

  it('updates the linked doc of this rikma', async () => {
    const run = runWith(decision({ playbookDoc: { data: docNode(103) } }));
    expect(await applyPlaybookDecision(run, '40', '103')).toMatchObject({ applied: true, docId: '9' });
    expect(run.mock.calls.find((c) => c[0] === 'playbookUpdate')![1]).toEqual({ id: '9', data: { body: 'net+30', name: 'Sales' } });
  });

  it('never writes into another rikma or an archived doc', async () => {
    expect(await applyPlaybookDecision(runWith(decision({ playbookDoc: { data: docNode(8) } })), '40', '103')).toEqual({ applied: false, reason: 'docGone' });
    expect(await applyPlaybookDecision(runWith(decision({ playbookDoc: { data: docNode(103, { archived: true }) } })), '40', '103')).toEqual({ applied: false, reason: 'docGone' });
    expect(await applyPlaybookDecision(runWith(decision()), '40', '8')).toEqual({ applied: false, reason: 'otherRikma' });
    expect(await applyPlaybookDecision(runWith(decision({ kind: 'pubdes' })), '40', '103')).toEqual({ applied: false, reason: 'notPlaybook' });
    expect(await applyPlaybookDecision(runWith(decision({ newPlaybook: '  ' })), '40', '103')).toEqual({ applied: false, reason: 'empty' });
  });
});

describe('writePlaybook', () => {
  it('throws when Strapi does not answer with an id', async () => {
    const run = vi.fn(async () => ({ errors: [{ message: 'Forbidden' }] }));
    await expect(writePlaybook(run, { projectId: '1', docId: null, roleId: null, title: '', body: 'x', byUserId: null })).rejects.toThrow(/playbookCreate/);
  });
});
