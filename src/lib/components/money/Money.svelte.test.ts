/**
 * The promise `<Money>` makes (docs/PLAN_MULTI_CURRENCY.md §1.3) is the same
 * one `<Translated>` makes for words, so it is tested the same way: a reader
 * always sees their own currency when there is a rate, a converted number
 * always says it is converted, the amount as stored is always reachable, and
 * with no rate nothing is invented.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { readable } from 'svelte/store';

// `t` echoes its key and payload so the provenance line is visible in assertions.
vi.mock('$lib/translations', () => ({
  t: readable((key: string, payload?: Record<string, unknown>) =>
    payload ? `${key}:${Object.values(payload).join(',')}` : key
  )
}));

import Money from './Money.svelte';
import { MoneyState } from '$lib/money/context.svelte';
import type { FxTable } from '$lib/money/convert.js';

const TABLE: FxTable = { base: 'USD', date: '2026-09-19', rates: { USD: 1, ILS: 3.04, EUR: 0.87 } };

// The component with no provider mounted reads the fallback reader: shekels,
// no rate table. The conversion rules are exercised on MoneyState below.

describe('<Money>', () => {
  it('renders the stored amount in its own currency when that is the reader\'s', () => {
    const { container } = render(Money, { amount: 120, currency: 'ILS' });
    expect(container.textContent).toContain('120');
    expect(container.textContent).toContain('₪');
    expect(container.textContent).not.toContain('≈');
  });

  it('renders nothing for a missing amount rather than a zero', () => {
    const { container } = render(Money, { amount: null });
    expect(container.textContent?.trim()).toBe('');
  });

  it('treats a legacy row with no currency as shekels', () => {
    const { container } = render(Money, { amount: 50 });
    expect(container.textContent).toContain('₪');
  });

  it('shows the writer\'s own figure alongside, when they typed another currency', () => {
    const { container } = render(Money, {
      amount: 152,
      currency: 'ILS',
      entry: { entryCurrency: 'USD', entryRate: 3.04 },
      detail: 'inline'
    });
    // The tooltip names what was typed: $50 at that day's rate.
    const bdi = container.querySelector('bdi');
    expect(bdi?.getAttribute('title') ?? '').toContain('money.writtenAs');
    expect(bdi?.getAttribute('title') ?? '').toContain('50');
  });

  it('formats a whole amount without decimals and a fractional one with them', () => {
    expect(render(Money, { amount: 120, currency: 'ILS' }).container.textContent).not.toContain('.00');
    expect(render(Money, { amount: 120.5, currency: 'ILS' }).container.textContent).toContain('.50');
  });

  it('keeps the number and its symbol in one bidi run', () => {
    const { container } = render(Money, { amount: 120, currency: 'USD' });
    expect(container.querySelector('bdi')).not.toBeNull();
  });
});

describe('MoneyState.view — the conversion rules', () => {
  const reader = (currency: string, fx: FxTable | null = TABLE) =>
    new MoneyState({ currency, fx, lang: 'he' });

  it('converts into the reader\'s currency and marks it', () => {
    const v = reader('USD').view(304, 'ILS');
    expect(v.converted).toBe(true);
    expect(v.text).toContain('≈');
    expect(v.text).toContain('100');
    expect(v.original).toContain('304');
  });

  it('does not convert — and does not mark — the reader\'s own currency', () => {
    const v = reader('ILS').view(304, 'ILS');
    expect(v.converted).toBe(false);
    expect(v.text).not.toContain('≈');
  });

  it('falls back to the stored amount when no rate is known', () => {
    const v = reader('XAF').view(304, 'ILS');
    expect(v.converted).toBe(false);
    expect(v.text).toBe(v.original);
    expect(v.text).toContain('304');
  });

  it('falls back to the stored amount when there is no table at all', () => {
    const v = reader('USD', null).view(304, 'ILS');
    expect(v.converted).toBe(false);
    expect(v.text).toContain('304');
  });
});
