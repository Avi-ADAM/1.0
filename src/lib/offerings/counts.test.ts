import { describe, it, expect } from 'vitest';
import { readOfferings } from './counts.js';

const ids = (n: number) => ({ data: Array.from({ length: n }, (_, i) => ({ id: String(i) })) });
const act = (id: string, naasa: boolean | null, status: number | null) => ({
  id,
  attributes: { shem: `act ${id}`, naasa, status }
});

describe('readOfferings', () => {
  const sample = {
    mission_offers: { data: [{ id: 'o1', attributes: { name: 'Logo design' } }, { id: 'o2' }] },
    mesimabetahaliches: {
      data: [
        {
          id: 'm1',
          attributes: {
            name: 'Build site',
            project: { data: { id: 7 } },
            acts: { data: [act('a1', false, 0), act('a2', true, 0), act('a3', null, null)] }
          }
        },
        { id: 'm2', attributes: { name: 'Copy', acts: { data: [act('a4', false, 100), act('a5', false, 40)] } } }
      ]
    },
    finnished_missions: ids(3),
    projects_1s: {
      data: [
        { id: 7, attributes: { matanotofs: { data: [{ id: 'p1', attributes: { name: 'Mug' } }, { id: 'p2' }] } } },
        { id: 9, attributes: { matanotofs: { data: [{ id: 'p3', attributes: { name: 'Tote' } }] } } }
      ]
    }
  };

  it('counts every figure the profile shows', () => {
    const o = readOfferings(sample);
    // Open acts: a1 (false,0), a3 (null,null), a5 (false,40) — done and 100% are not.
    expect([o.products, o.missions, o.done, o.acts]).toEqual([3, 4, 3, 3]);
  });

  it('lists the items with the rikma each belongs to', () => {
    const o = readOfferings(sample);
    expect(o.doing).toEqual([
      { id: 'm1', name: 'Build site', projectId: '7' },
      { id: 'm2', name: 'Copy', projectId: null }
    ]);
    expect(o.openActs.map((a) => [a.id, a.projectId])).toEqual([
      ['a1', '7'],
      ['a3', '7'],
      ['a5', null]
    ]);
    expect(o.productList.map((p) => [p.name, p.projectId])).toEqual([
      ['Mug', '7'],
      ['', '7'],
      ['Tote', '9']
    ]);
    expect(o.offers[0]).toEqual({ id: 'o1', name: 'Logo design', projectId: null });
  });

  it('reads an empty or missing profile as zeros', () => {
    const empty = readOfferings(undefined);
    expect([empty.products, empty.missions, empty.done, empty.acts]).toEqual([0, 0, 0, 0]);
    expect(empty.doing).toEqual([]);
    expect(readOfferings({ mesimabetahaliches: { data: [{ id: '1' }] } }).missions).toBe(1);
  });
});
