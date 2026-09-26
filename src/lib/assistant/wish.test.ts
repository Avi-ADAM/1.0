import { describe, expect, it } from 'vitest';
import { committedRows, planWishApply, wishToState } from './wish.js';
import { applyOps } from './applyOps.js';

const ratson = {
  attributes: {
    name: 'יום הולדת לדנה',
    extracted_missions: [
      { name: 'צלם', importance: 'must', hoursEst: 3 },
      { name: 'DJ', importance: 'nice' },
      { name: 'עיצוב הזמנה', importance: 'nice' }
    ],
    extracted_resources: [{ name: 'עוגה', importance: 'must', quantityEst: 1 }]
  }
};
const proposals = [
  { attributes: { status_proposal: 'suggested', covered_missions: [{ extracted_mission_idx: '1' }], covered_resources: [] } },
  { attributes: { status_proposal: 'dismissed', covered_missions: [{ extracted_mission_idx: '2' }] } }
];

describe('wish as a list', () => {
  it('knows which rows someone already answered (by position; dismissed ones do not count)', () => {
    const c = committedRows(proposals);
    expect([...c.missions]).toEqual([1]);
    const s = wishToState(ratson, proposals);
    expect(s.items.map((i) => [i.key, i.label, !!i.committed, i.spec?.idx])).toEqual([
      ['w1', 'צלם', false, 0],
      ['w2', 'DJ', true, 1],
      ['w3', 'עיצוב הזמנה', false, 2],
      ['w4', 'עוגה', false, 0]
    ]);
    expect(s.fields).toMatchObject({ title: 'יום הולדת לדנה' });
  });

  it('an answered row cannot be changed from the chat', () => {
    const s = wishToState(ratson, proposals);
    const r = applyOps(s, [{ op: 'rename', key: 'w2', label: 'להקה' }], { kind: 'wish', origin: 'agent' });
    expect(r.rejected[0]?.reason).toBe('committed');
  });

  it('never moves an answered row: a "not now" before it stays, one after it goes, new rows go last', () => {
    let s = wishToState(ratson, proposals);
    s = applyOps(
      s,
      [
        { op: 'drop', key: 'w1' },
        { op: 'drop', key: 'w3' },
        { op: 'add', group: 'wishMissions', label: 'מנחה' },
        { op: 'setSpec', key: 'w4', spec: { quantityEst: 2 } }
      ],
      { kind: 'wish', origin: 'manual' }
    ).state;
    const plan = planWishApply(s);
    expect(plan.extracted_missions.map((r) => r.name)).toEqual(['צלם', 'DJ', 'מנחה']);
    expect(plan.kept).toEqual(['w1']);
    expect(plan.extracted_resources).toEqual([{ name: 'עוגה', importance: 'must', quantityEst: 2 }]);
    expect(plan.changed).toBe(true);
  });

  it('nothing to write when nothing changed; an edit to a saved row is a change', () => {
    const s = wishToState(ratson, proposals);
    expect(planWishApply(s, ratson.attributes).changed).toBe(false);
    const edited = applyOps(s, [{ op: 'setSpec', key: 'w4', spec: { quantityEst: 3 } }], { kind: 'wish', origin: 'manual' }).state;
    expect(planWishApply(edited, ratson.attributes).changed).toBe(true);
  });
});
