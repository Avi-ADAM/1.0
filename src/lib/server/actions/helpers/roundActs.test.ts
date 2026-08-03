import { describe, it, expect, vi } from 'vitest';
import { buildRoundActs, resolveAcceptedActs } from './roundActs';

const ctx = { userId: '7', jwt: 'jwt' } as any;

function strapiStub(createdIds: Array<string | null>) {
  let i = 0;
  const calls: any[] = [];
  return {
    calls,
    execute: vi.fn(async (qid: string, vars: Record<string, unknown>) => {
      calls.push({ qid, vars });
      const id = createdIds[i++];
      return id ? { data: { createAct: { data: { id } } } } : { data: { createAct: null } };
    }),
  };
}

describe('buildRoundActs', () => {
  it('returns kept ids plus the ids of the items created in this round', async () => {
    const strapi = strapiStub(['90', '91']);
    const acts = await buildRoundActs(strapi as any, ctx, {
      projectId: '3',
      existingActsIds: ['11', 12],
      newActs: [
        { shem: 'לכתוב בריף' },
        { shem: 'לתאם פגישה', des: 'עם הלקוח', dateS: '2026-08-01T09:00:00.000Z' },
      ],
    });

    expect(acts).toEqual(['11', '12', '90', '91']);
    expect(strapi.execute).toHaveBeenCalledTimes(2);
  });

  it('never links a round item to the shared offer', async () => {
    const strapi = strapiStub(['90']);
    await buildRoundActs(strapi as any, ctx, {
      projectId: '3',
      newActs: [{ shem: 'משימה חדשה' }],
    });

    const vars = strapi.calls[0].vars;
    expect(strapi.calls[0].qid).toBe('4crtask');
    expect(vars.open_mission).toBeNull();
    expect(vars.pendm).toBeNull();
    expect(vars.mbId).toBeNull();
    expect(vars.pid).toBe('3');
  });

  it('keeps the round alive when one item fails to be created', async () => {
    const strapi = strapiStub([null, '92']);
    const acts = await buildRoundActs(strapi as any, ctx, {
      projectId: '3',
      existingActsIds: ['11'],
      newActs: [{ shem: 'נופלת' }, { shem: 'עוברת' }],
    });

    expect(acts).toEqual(['11', '92']);
  });

  it('drops rows with no title and normalizes dates', async () => {
    const strapi = strapiStub(['93']);
    await buildRoundActs(strapi as any, ctx, {
      projectId: '3',
      newActs: [
        { shem: '' } as any,
        { shem: 'עם תאריך', dateS: '2026-08-01T09:00', dateF: 'not a date' },
      ],
    });

    expect(strapi.execute).toHaveBeenCalledTimes(1);
    expect(strapi.calls[0].vars.dateS).toBe(new Date('2026-08-01T09:00').toISOString());
    expect(strapi.calls[0].vars.dateF).toBeNull();
  });

  it('proposes an empty checklist when the negotiator cleared it', async () => {
    const strapi = strapiStub([]);
    const acts = await buildRoundActs(strapi as any, ctx, { projectId: '3' });
    expect(acts).toEqual([]);
    expect(strapi.execute).not.toHaveBeenCalled();
  });
});

describe('resolveAcceptedActs', () => {
  const baseline = { data: [{ id: '1' }, { id: '2' }] };
  const round = (ordern: number, actIds: string[]) => ({
    id: String(ordern),
    attributes: { ordern, acts: { data: actIds.map((id) => ({ id })) } },
  });

  it('takes the negotiated list from the latest round that carries one', () => {
    const rounds = [round(2, ['5', '6']), round(1, ['3'])];
    expect(resolveAcceptedActs(rounds, baseline)).toEqual(['5', '6']);
  });

  it('walks back past rounds that said nothing about the checklist', () => {
    // A candidate's first-proposal round has no checklist UI, so it records
    // none — the member's earlier addition must survive it.
    const rounds = [round(2, []), round(1, ['3', '4'])];
    expect(resolveAcceptedActs(rounds, baseline)).toEqual(['3', '4']);
  });

  it('falls back to the offer baseline when no round carries a checklist', () => {
    expect(resolveAcceptedActs([round(1, [])], baseline)).toEqual(['1', '2']);
    expect(resolveAcceptedActs([], baseline)).toEqual(['1', '2']);
    expect(resolveAcceptedActs(null, baseline)).toEqual(['1', '2']);
  });

  it('accepts a Strapi relation payload as well as a plain array', () => {
    expect(resolveAcceptedActs({ data: [round(1, ['9'])] }, baseline)).toEqual(['9']);
  });

  it('returns nothing when neither side has a checklist', () => {
    expect(resolveAcceptedActs(null, null)).toEqual([]);
  });
});
