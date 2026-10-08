import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import { createRawSnippet } from 'svelte';
import he from '$lib/translations/he/deals.json';
import type { PaymentState } from '$lib/sheirut/paymentState';

// The real `he` strings, so a missing key shows up as a missing label.
vi.mock('$lib/translations', () => {
  const dict = he as Record<string, any>;
  const t = readable((key: string) => {
    const raw = key
      .replace(/^deals\./, '')
      .split('.')
      .reduce((o: any, k) => o?.[k], dict);
    return typeof raw === 'string' ? raw : '';
  });
  return { t, isRtl: readable(true), locale: readable('he') };
});

const CostPanel = (await import('./CostPanel.svelte')).default;

const flow = createRawSnippet(() => ({ render: () => '<div data-testid="flow">payment flow</div>' }));

function panel(pay: PaymentState | null, withFlow = true) {
  return render(CostPanel as any, {
    props: {
      totalCost: 1000,
      paid: 0,
      costBreakdown: { missions: 1000, resources: 0 },
      pay,
      payment: withFlow ? flow : undefined
    }
  });
}

const text = (c: HTMLElement) => (c.textContent ?? '').replace(/\s+/g, ' ');

describe('CostPanel — the "next payment" button tells the truth', () => {
  it('open: the button opens the customer payment flow, and closes it again', async () => {
    const v = panel('open');
    const btn = v.getByRole('button', { name: he.nextPayment });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(v.queryByTestId('flow')).toBeNull();
    await fireEvent.click(btn);
    expect(v.getByTestId('flow')).toBeTruthy();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(btn.textContent?.trim()).toBe(he.pay.hide);
    await fireEvent.click(btn);
    expect(v.queryByTestId('flow')).toBeNull();
  });

  it('sent: the same flow, to follow the transfer', async () => {
    const v = panel('sent');
    await fireEvent.click(v.getByRole('button', { name: he.pay.track }));
    expect(v.getByTestId('flow')).toBeTruthy();
  });

  it('not open yet: a disabled button that says why', () => {
    const v = panel('notYet');
    const btn = v.getByRole('button', { name: he.pay.closed }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(text(v.container)).toContain(he.due.payWhenFinal);
  });

  it('supplier, paid, nothing left: no button at all, only the explanation', () => {
    for (const [pay, note] of [
      ['supplier', he.pay.supplierNote],
      ['paid', he.pay.paidNote],
      ['nothingLeft', he.due.nothingLeft]
    ] as const) {
      const v = panel(pay);
      expect(v.queryByRole('button')).toBeNull();
      expect(text(v.container)).toContain(note);
      v.unmount();
    }
  });

  it('no flow to open: never a dead button', () => {
    const v = panel('open', false);
    expect(v.queryByRole('button')).toBeNull();
  });
});
