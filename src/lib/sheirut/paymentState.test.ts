import { describe, expect, it } from 'vitest';
import { paymentState } from './paymentState';

const due = (over: Partial<{ final: boolean; remaining: number; settled: boolean }> = {}) => ({
  final: true,
  remaining: 100,
  settled: false,
  ...over
});

describe('paymentState', () => {
  it('a supplier never gets the customer payment', () => {
    expect(paymentState({}, due(), false)).toBe('supplier');
    expect(paymentState({ moneyTransfered: true }, null, false)).toBe('supplier');
  });

  it('a paid deal reads paid, whichever fact says so', () => {
    expect(paymentState({ moneyTransfered: true, iTransferMoney: true }, null)).toBe('paid');
    expect(paymentState({ iTransferMoney: true }, due({ settled: true }))).toBe('paid');
  });

  it('a sent transfer waits for its receiver before anything else', () => {
    expect(paymentState({ iTransferMoney: true }, due({ final: false }))).toBe('sent');
  });

  it('a wish deal opens only once every part is finished', () => {
    expect(paymentState({}, due({ final: false }))).toBe('notYet');
    expect(paymentState({}, due({ remaining: 0 }))).toBe('nothingLeft');
    expect(paymentState({}, due())).toBe('open');
  });

  it('a deal without a due figure is paid at its agreed total, as before', () => {
    expect(paymentState({}, null)).toBe('open');
  });
});
