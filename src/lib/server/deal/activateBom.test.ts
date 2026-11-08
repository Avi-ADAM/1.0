/**
 * activateBom — a deal puts a product's work in progress, but never work the
 * rikma is still voting on: an open pendm on a line means nobody has agreed to
 * that mission yet (nor to whom it goes).
 */
import { describe, it, expect, vi } from 'vitest';
import { activateBom } from './activateBom';

const line = (id: string, pendm: Record<string, unknown> | null, extra: Record<string, unknown> = {}) => ({
  id,
  attributes: {
    hoursPerUnit: 20,
    ratePerHour: 100,
    mode: 'createNew',
    pendm: { data: pendm ? { id: `p${id}`, attributes: { name: `m${id}`, rishon: { data: { id: '1' } }, ...pendm } } : null },
    mesimabetahalich: { data: null },
    ...extra
  }
});

function run(lines: any[]) {
  let n = 0;
  const exec = vi.fn(async (qid: string) => {
    if (qid === '139createMesimabetahalich') return { data: { createMesimabetahalich: { data: { id: String(++n + 900) } } } };
    return {};
  });
  const out = activateBom(exec, {
    projectId: '51',
    matanot: { id: '80', attributes: { name: 'אתר', matanot_recipe_missions: { data: lines }, matanot_recipe_resources: { data: [] } } },
    fallbackSellerId: '1'
  });
  return { exec, out };
}

describe('activateBom', () => {
  it('skips a line whose pendm is still an open vote', async () => {
    const { exec, out } = run([line('14', { archived: false })]);
    expect((await out).missionIds).toEqual([]);
    expect(exec).not.toHaveBeenCalled();
  });

  it('opens a decided line, and a legacy one with no archived flag', async () => {
    const { exec, out } = run([line('1', { archived: true }), line('2', {})]);
    expect((await out).missionIds).toEqual(['901', '902']);
    expect(exec.mock.calls.filter(([q]) => q === '139createMesimabetahalich')).toHaveLength(2);
  });

  it('opens no maap for a resource line whose pmash is still open', async () => {
    const exec = vi.fn(async () => ({}));
    await activateBom(exec, {
      projectId: '51',
      matanot: { id: '80', attributes: { name: 'x', matanot_recipe_missions: { data: [] }, matanot_recipe_resources: { data: [
        { id: 'r1', attributes: { mode: 'createNew', pmash: { data: { id: 'q1', attributes: { name: 'a', archived: false } } }, mashabetahalich: { data: null } } },
        { id: 'r2', attributes: { mode: 'createNew', pmash: { data: { id: 'q2', attributes: { name: 'b', archived: true } } }, mashabetahalich: { data: null } } }
      ] } } },
      fallbackSellerId: '1'
    });
    expect(exec.mock.calls.map(([q, v]: any) => [q, v.data.pmash])).toEqual([['141createMaap', 'q2']]);
  });

  it('keeps the mission a line already holds, even if its pendm reads open', async () => {
    const { exec, out } = run([line('3', { archived: false }, { mesimabetahalich: { data: { id: '220' } } })]);
    expect((await out).missionIds).toEqual(['220']);
    expect(exec.mock.calls.some(([q]) => q === '139createMesimabetahalich')).toBe(false);
  });
});
