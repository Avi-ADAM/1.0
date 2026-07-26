import { describe, expect, it, vi } from 'vitest';
import {
  createPlanBoardAction,
  updatePlanBoardAction,
  createPlanItemAction,
  updatePlanItemAction,
  markPlanItemCreatedAction
} from './planningBoards';
import type { ActionExecutionHandler } from '../types.js';

const context = { userId: '7', jwt: 'jwt', fetch: globalThis.fetch } as any;

/** Board read payload shaped like qid 286getPlanBoard. */
function boardPayload(projectId: string, items: any[] = []) {
  return {
    data: {
      projectPlanBoard: {
        data: {
          id: '1',
          attributes: {
            title: 'Marketing',
            status: 'expanded',
            project: { data: { id: projectId } },
            items: { data: items }
          }
        }
      }
    }
  };
}

function item(id: string, attrs: Record<string, any> = {}) {
  return { id, attributes: { kind: 'mission', name: 'Design logo', status: 'proposed', ...attrs } };
}

/** Minimal strapi double: routes each qid to a canned response. */
function strapiDouble(responses: Record<string, any>) {
  const execute = vi.fn(async (qid: string) => {
    if (!(qid in responses)) throw new Error(`unexpected qid ${qid}`);
    const r = responses[qid];
    return typeof r === 'function' ? r() : r;
  });
  return { strapi: { execute } as any, execute };
}

const run = (action: any, params: any, strapi: any) =>
  (action.graphqlOperation as ActionExecutionHandler)(params, context, { strapi } as any);

// ── config sanity ─────────────────────────────────────────────
describe('planning board action configs', () => {
  const all = [
    createPlanBoardAction,
    updatePlanBoardAction,
    createPlanItemAction,
    updatePlanItemAction,
    markPlanItemCreatedAction
  ];

  it('are all gated on jwt + projectMember', () => {
    for (const a of all) {
      const types = a.authRules.map((r: any) => r.type);
      expect(types, a.key).toContain('jwt');
      expect(types, a.key).toContain('projectMember');
      const memberRule: any = a.authRules.find((r: any) => r.type === 'projectMember');
      expect(memberRule.config.projectIdParam, a.key).toBe('projectId');
    }
  });

  it('require projectId so membership can actually be checked', () => {
    for (const a of all) {
      expect(a.paramSchema.projectId?.required, a.key).toBe(true);
    }
  });

  it('are not exposed to raw API keys', () => {
    for (const a of all) {
      expect(a.access, a.key).not.toContain('apiKey');
    }
  });
});

// ── cross-project isolation ───────────────────────────────────
describe('project ownership enforcement', () => {
  it('refuses to touch a board belonging to another project', async () => {
    const { strapi } = strapiDouble({ '286getPlanBoard': boardPayload('999') });
    await expect(
      run(updatePlanBoardAction, { boardId: '1', projectId: '42', title: 'x' }, strapi)
    ).rejects.toThrow(/does not belong to the given project/);
  });

  it('refuses to add an item to another project\'s board', async () => {
    const { strapi } = strapiDouble({ '286getPlanBoard': boardPayload('999') });
    await expect(
      run(createPlanItemAction, { boardId: '1', projectId: '42', name: 'x' }, strapi)
    ).rejects.toThrow(/does not belong to the given project/);
  });

  it('refuses an item that is not part of the given board', async () => {
    const { strapi } = strapiDouble({ '286getPlanBoard': boardPayload('42', [item('5')]) });
    await expect(
      run(updatePlanItemAction, { itemId: '77', boardId: '1', projectId: '42', imp: 'must' }, strapi)
    ).rejects.toThrow(/not part of this board/);
  });
});

// ── created is terminal ───────────────────────────────────────
describe('created rows are terminal', () => {
  it('rejects edits to a row that already produced a real entity', async () => {
    const { strapi } = strapiDouble({
      '286getPlanBoard': boardPayload('42', [item('5', { status: 'created' })])
    });
    await expect(
      run(updatePlanItemAction, { itemId: '5', boardId: '1', projectId: '42', name: 'new' }, strapi)
    ).rejects.toThrow(/already been created/);
  });

  it('refuses to set status=created directly', async () => {
    const { strapi } = strapiDouble({ '286getPlanBoard': boardPayload('42', [item('5')]) });
    await expect(
      run(updatePlanItemAction, { itemId: '5', boardId: '1', projectId: '42', status: 'created' }, strapi)
    ).rejects.toThrow(/markPlanItemCreated/);
  });

  it('markPlanItemCreated is idempotent — a retry keeps the original ref', async () => {
    const existing = item('5', { status: 'created', createdRef: { type: 'act', id: '900' } });
    const { strapi, execute } = strapiDouble({ '286getPlanBoard': boardPayload('42', [existing]) });

    const res: any = await run(
      markPlanItemCreatedAction,
      { itemId: '5', boardId: '1', projectId: '42', createdType: 'act', createdId: '901' },
      strapi
    );

    // Returned the stored row and never issued an update mutation.
    expect(res.attributes.createdRef).toEqual({ type: 'act', id: '900' });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls.every(([qid]) => qid !== '290updatePlanItem')).toBe(true);
  });

  it('records what was created on the first mark', async () => {
    const { strapi, execute } = strapiDouble({
      '286getPlanBoard': boardPayload('42', [item('5')]),
      '290updatePlanItem': { data: { updateProjectPlanItem: { data: { id: '5' } } } }
    });

    await run(
      markPlanItemCreatedAction,
      { itemId: '5', boardId: '1', projectId: '42', createdType: 'act', createdId: '900' },
      strapi
    );

    const updateCall = execute.mock.calls.find(([qid]) => qid === '290updatePlanItem');
    expect(updateCall).toBeDefined();
    const data = (updateCall as any[])[1].data;
    expect(data.status).toBe('created');
    expect(data.createdRef).toMatchObject({ type: 'act', id: '900' });
  });
});

// ── normalisation ─────────────────────────────────────────────
describe('input normalisation', () => {
  it('an AI-scanned direction starts as suggested, a manual board as active', async () => {
    const made = { data: { createProjectPlanBoard: { data: { id: '1' } } } };

    const a = strapiDouble({ '287createPlanBoard': made });
    await run(createPlanBoardAction, { projectId: '42', title: 'A', origin: 'quickScan' }, a.strapi);
    expect(a.execute.mock.calls[0][1].status).toBe('suggested');

    const b = strapiDouble({ '287createPlanBoard': made });
    await run(createPlanBoardAction, { projectId: '42', title: 'B', origin: 'manual' }, b.strapi);
    expect(b.execute.mock.calls[0][1].status).toBe('active');
  });

  it('falls back to a manual origin when given an unknown one', async () => {
    const { strapi, execute } = strapiDouble({
      '287createPlanBoard': { data: { createProjectPlanBoard: { data: { id: '1' } } } }
    });
    await run(createPlanBoardAction, { projectId: '42', title: 'A', origin: 'wat' }, strapi);
    expect(execute.mock.calls[0][1].origin).toBe('manual');
  });

  it('rejects unknown item kinds and blank names', async () => {
    const { strapi } = strapiDouble({ '286getPlanBoard': boardPayload('42') });
    await expect(
      run(createPlanItemAction, { boardId: '1', projectId: '42', name: 'x', kind: 'wat' }, strapi)
    ).rejects.toThrow(/Unknown plan item kind/);
    await expect(
      run(createPlanItemAction, { boardId: '1', projectId: '42', name: '   ' }, strapi)
    ).rejects.toThrow(/name is required/);
  });

  it('accepts act rows and stores their assignee spec verbatim', async () => {
    const { strapi, execute } = strapiDouble({
      '286getPlanBoard': boardPayload('42'),
      '289createPlanItem': { data: { createProjectPlanItem: { data: { id: '9' } } } }
    });
    const spec = { assigneeKind: 'role', roleIds: ['3'], roleNames: ['מעצב'] };
    await run(
      createPlanItemAction,
      { boardId: '1', projectId: '42', kind: 'act', name: 'עדכון הלוגו', imp: 'must', spec },
      strapi
    );
    const args = execute.mock.calls.find(([q]) => q === '289createPlanItem')?.[1] as any;
    expect(args.kind).toBe('act');
    expect(args.imp).toBe('must');
    expect(args.spec).toEqual(spec);
    expect(args.status).toBe('proposed');
  });
});
