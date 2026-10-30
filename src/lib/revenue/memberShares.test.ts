import { describe, expect, it } from 'vitest';
import { memberShares } from './memberShares';

const user = (id: string, username: string) => ({ id, attributes: { username } });
const by = (id: string, total: number) => ({ attributes: { total, users_permissions_user: { data: { id } } } });

describe('memberShares', () => {
  it('a rikma with nothing recorded has no value and nobody owns a share', () => {
    const r = memberShares({ users: [user('1', 'a'), user('2', 'b')] });
    expect(r.net).toBe(0);
    expect(r.others).toBe(0);
    expect(r.rows.map((x) => x.p)).toEqual([0, 0]);
  });

  it('missions and resources add up per member', () => {
    const r = memberShares({
      users: [user('1', 'a'), user('2', 'b')],
      fmiData: [by('1', 300), by('2', 100)],
      rikmashes: [by('2', 600)]
    });
    expect(r.net).toBe(1000);
    expect(r.rows).toEqual([
      { uid: '1', username: 'a', total: 300, p: 30 },
      { uid: '2', username: 'b', total: 700, p: 70 }
    ]);
  });

  it('value of someone who is no longer a member stays in the total, as `others`', () => {
    const r = memberShares({ users: [user('1', 'a')], fmiData: [by('1', 250), by('9', 750)] });
    expect(r.rows[0].p).toBe(25);
    expect(r.others).toBe(750);
  });

  it('a confirmed stipend credits the funder and debits the recipient', () => {
    const r = memberShares({
      users: [user('1', 'a'), user('2', 'b')],
      fmiData: [by('2', 1000)],
      stipendPayments: [
        { attributes: { funder: { data: { id: '1' } }, recipient: { data: { id: '2' } }, equityCredit: 400, equityDebit: 400 } }
      ]
    });
    expect(r.net).toBe(1000);
    expect(r.rows.map((x) => x.total)).toEqual([400, 600]);
  });
});
