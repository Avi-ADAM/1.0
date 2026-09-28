import { describe, it, expect, vi } from 'vitest';
import { findOrCreateMissionTemplate } from './missionTemplate';

function fakeStrapi(handlers: Record<string, (vars: any) => any>) {
  const execute = vi.fn(async (queryId: string, vars: any) => {
    const h = handlers[queryId];
    if (!h) throw new Error(`unexpected query ${queryId}`);
    return h(vars);
  });
  return { execute };
}

const found = (id: string | null) => ({ data: { missions: { data: id ? [{ id }] : [] } } });

describe('findOrCreateMissionTemplate', () => {
  it('reuses a template that already has the name', async () => {
    const strapi = fakeStrapi({ '261findMissionByName': () => found('42') });
    const res = await findOrCreateMissionTemplate(strapi, { missionName: 'code review' });
    expect(res).toEqual({ id: '42', created: false });
    expect(strapi.execute).toHaveBeenCalledTimes(1);
  });

  it('creates a template when the name is new, trimmed', async () => {
    const strapi = fakeStrapi({
      '261findMissionByName': () => found(null),
      '21createMission': () => ({ data: { createMission: { data: { id: '7' } } } })
    });
    const res = await findOrCreateMissionTemplate(strapi, { missionName: '  new one ', skills: ['1'] });
    expect(res).toEqual({ id: '7', created: true });
    const [, vars] = strapi.execute.mock.calls[1];
    expect(vars.missionName).toBe('new one');
    expect(vars.skills).toEqual(['1']);
  });

  it('falls back to the existing row when the create loses a race', async () => {
    let lookups = 0;
    const strapi = fakeStrapi({
      '261findMissionByName': () => found(lookups++ === 0 ? null : '9'),
      '21createMission': () => {
        const e: any = new Error('This attribute must be unique');
        e.errors = [{ message: 'This attribute must be unique' }];
        throw e;
      }
    });
    const res = await findOrCreateMissionTemplate(strapi, { missionName: 'x' });
    expect(res).toEqual({ id: '9', created: false });
  });

  it('rethrows other failures', async () => {
    const strapi = fakeStrapi({
      '261findMissionByName': () => found(null),
      '21createMission': () => {
        throw new Error('NETWORK_ERROR');
      }
    });
    await expect(findOrCreateMissionTemplate(strapi, { missionName: 'x' })).rejects.toThrow('NETWORK_ERROR');
  });

  it('refuses an empty name', async () => {
    const strapi = fakeStrapi({});
    await expect(findOrCreateMissionTemplate(strapi, { missionName: '  ' })).rejects.toThrow();
  });
});
