import { describe, expect, it } from 'vitest';
import { splitPreview } from './splitPreview';

const user = (id: string, username: string) => ({ id, attributes: { username } });
const by = (id: string) => ({ data: { id } });
const work = (id: string, total: number) => ({ attributes: { total, users_permissions_user: by(id) } });
const sale = (id: string, amount: number, splited = false) => ({
  attributes: { in: amount, splited, users_permissions_user: by(id) }
});

const users = [user('1', 'noa'), user('2', 'yossi'), user('3', 'shira')];
// 45% / 35% / 20% of a rikma worth 10,000.
const fmiData = [work('1', 4500), work('2', 3500), work('3', 2000)];

describe('splitPreview (port of whowhat.svelte distribute)', () => {
  it('matches the canvas example: the one holding most hands on to the others', () => {
    const { revach, rows } = splitPreview({
      users,
      fmiData,
      sales: [sale('1', 2990), sale('2', 780), sale('3', 190), sale('1', 5000, true)]
    });
    expect(revach).toBe(3960);
    const [noa, yossi, shira] = rows;
    expect(noa.p).toBeCloseTo(45);
    expect(noa.x).toBeCloseTo(1782);
    expect(noa.noten).toBeCloseTo(1208);
    expect(yossi.meca).toBeCloseTo(606);
    expect(shira.meca).toBeCloseTo(602);
    // Largest need first, a giver never pays themself.
    expect(noa.le.map((l) => [l.toName, Math.round(l.amount)])).toEqual([
      ['yossi', 606],
      ['shira', 602]
    ]);
    expect(yossi.le).toEqual([]);
    expect(shira.le).toEqual([]);
  });

  it('a rikma with no value yet splits nothing and shows no NaN', () => {
    const { rows } = splitPreview({ users, sales: [sale('1', 100)] });
    for (const r of rows) {
      expect(r.p).toBe(0);
      expect(r.x).toBe(0);
      expect(Number.isNaN(r.noten)).toBe(false);
    }
    // All of it is surplus with the holder, and there is nobody to receive it.
    expect(rows[0].noten).toBe(100);
    expect(rows[0].le).toEqual([]);
  });

  it('folds confirmed stipend equity into the shares, as the split table does', () => {
    const { rows } = splitPreview({
      users,
      fmiData,
      stipendPayments: [
        { attributes: { funder: by('3'), recipient: by('2'), equityCredit: 2000, equityDebit: 0 } }
      ],
      sales: [sale('1', 1200)]
    });
    // Shira's 2,000 + 2,000 out of 12,000.
    expect(rows[2].p).toBeCloseTo((4000 / 12000) * 100);
  });

  it('splits a giver across several receivers and leaves a balanced member alone', () => {
    const { rows } = splitPreview({
      users,
      fmiData: [work('1', 5000), work('2', 5000)],
      sales: [sale('1', 1000), sale('2', 0)]
    });
    expect(rows[0].le).toEqual([{ toId: '2', toName: 'yossi', amount: 500 }]);
    expect(rows[2].noten).toBe(0);
    expect(rows[2].meca).toBe(0);
  });
});
