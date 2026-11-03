import { describe, expect, it } from 'vitest';
import {
  acceptRound,
  canAnswer,
  canDeliver,
  defectsRound,
  deliverRound,
  maturesOnSilence,
  receiptState,
  receiptView
} from './dealReceipt';

/** Member 1 delivers; customers 9 and 10 receive. */
const T = '2026-11-03T10:00:00.000Z';
const T2 = '2026-11-04T10:00:00.000Z';

describe('receiptState', () => {
  it('nothing said yet: the rikma may deliver, nothing matures', () => {
    const s = receiptState({ votes: [], customerIds: ['9'] });
    expect(s).toMatchObject({ status: 'none', round: 0 });
    expect(canDeliver(s)).toBe(true);
    expect(maturesOnSilence(s)).toBe(false);
  });

  it('a delivery asks every customer, and her silence matures it', () => {
    const v = deliverRound([], '1', ['9', '10'], T, 'the logo files');
    const s = receiptState({ votes: v, customerIds: ['9', '10'] });
    expect(s).toMatchObject({ status: 'delivered', openerId: '1', why: 'the logo files', pendingCustomers: ['9', '10'] });
    expect(canAnswer(s, '9')).toBe(true);
    expect(canAnswer(s, '1')).toBe(false);
    expect(canDeliver(s)).toBe(false);
    expect(maturesOnSilence(s)).toBe(true);
  });

  it('received once every customer said yes', () => {
    let v = deliverRound([], '1', ['9', '10'], T);
    v = acceptRound(v, '9', T2);
    expect(receiptState({ votes: v, customerIds: ['9', '10'] })).toMatchObject({ status: 'delivered', pendingCustomers: ['10'] });
    v = acceptRound(v, '10', T2);
    expect(receiptState({ votes: v, customerIds: ['9', '10'] }).status).toBe('accepted');
  });

  it('defects are a counter: a new round, nothing matures, the rikma delivers again', () => {
    let v = deliverRound([], '1', ['9'], T);
    v = defectsRound(v, '9', '1', T2, 'the colours are wrong');
    const s = receiptState({ votes: v, customerIds: ['9'] });
    expect(s).toMatchObject({ status: 'defects', round: 2, openerId: '9', why: 'the colours are wrong' });
    expect(maturesOnSilence(s)).toBe(false);
    expect(canDeliver(s)).toBe(true);
    expect(canAnswer(s, '9')).toBe(false);

    v = deliverRound(v, '1', ['9'], '2026-11-05T10:00:00.000Z', 'fixed');
    const again = receiptState({ votes: v, customerIds: ['9'] });
    expect(again).toMatchObject({ status: 'delivered', round: 3 });
    expect(again.history.map((h) => h.kind)).toEqual(['delivered', 'defects', 'delivered']);
  });

  it('productExepted is received, whatever the rounds say', () => {
    expect(receiptState({ votes: deliverRound([], '1', ['9'], T), customerIds: ['9'], accepted: true }).status).toBe('accepted');
  });
});

describe('receiptView', () => {
  const r = (votes: any[], accepted = false) => ({
    state: receiptState({ votes, customerIds: ['9'], accepted }),
    deadline: null,
    memberIds: ['1', '2'],
    customerIds: ['9'],
    names: { '1': 'Dana', '9': 'Noa' }
  });

  it('a member may deliver, the customer may only confirm her own receipt', () => {
    expect(receiptView(r([]), '2')).toMatchObject({ canDeliver: true, canAnswer: false, canConfirm: false });
    expect(receiptView(r([]), '9')).toMatchObject({ canDeliver: false, canAnswer: false, canConfirm: true });
  });

  it('on a delivery she answers, with the names in the history', () => {
    const v = receiptView(r(deliverRound([], '1', ['9'], T, 'done')), '9');
    expect(v).toMatchObject({ status: 'delivered', canAnswer: true, canConfirm: false });
    expect(v.history).toEqual([{ kind: 'delivered', byName: 'Dana', why: 'done', zman: T }]);
  });

  it('a stranger can do nothing', () => {
    expect(receiptView(r(deliverRound([], '1', ['9'], T)), '77')).toMatchObject({ canDeliver: false, canAnswer: false, canConfirm: false });
  });
});
