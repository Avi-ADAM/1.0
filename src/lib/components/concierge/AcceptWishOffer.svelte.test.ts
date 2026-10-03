import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readable } from 'svelte/store';

/**
 * QA_CONCIERGE_E2E C-9 — the invited provider's "negotiate" was a button that said
 * "soon". It is now a counter: other hours and price, with the reason, sent through
 * `counterRatsonProposal`; and when the provider already signed last, the dialog
 * says it is the wisher's move instead of offering to approve their own terms.
 */

const executeAction = vi.fn();
vi.mock('$lib/client/actionClient', () => ({ executeAction: (...a: unknown[]) => executeAction(...a) }));
vi.mock('svelte-sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock('$lib/translations', () => ({
  t: readable((key: string) => key),
  isRtl: readable(true)
}));
vi.mock('$lib/stores/lang.js', () => ({ lang: readable('he') }));
vi.mock('$lib/components/money/Money.svelte', () => ({ default: () => {} }));
vi.mock('$lib/celim/icons/EntityIcon.svelte', () => ({ default: () => {} }));

const AcceptWishOffer = (await import('./AcceptWishOffer.svelte')).default;

const item = { kind: 'mission' as const, name: 'הרכבת מחשב', hours: 4, price: 600 };
const props = (over: Record<string, unknown> = {}) => ({
  proposalId: '77',
  ratsonId: '16',
  item,
  ...over
});

const button = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(text)) as HTMLButtonElement;

describe('AcceptWishOffer — the counter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('negotiate is no longer a placeholder — it opens a form prefilled with the terms on the table', async () => {
    const { baseElement } = render(AcceptWishOffer as any, { props: props() });
    await fireEvent.click(button(baseElement, 'deals.negTitle'));
    await tick();

    const [hours, price] = [...baseElement.querySelectorAll('input[type="number"]')] as HTMLInputElement[];
    expect(Number(hours.value)).toBe(4);
    expect(Number(price.value)).toBe(600);
    expect(baseElement.textContent).toContain('deals.negHint');
    expect(baseElement.textContent).not.toContain('בקרוב');
  });

  it('will not send terms that change nothing, or a bare number with no reason', async () => {
    const { baseElement } = render(AcceptWishOffer as any, { props: props() });
    await fireEvent.click(button(baseElement, 'deals.negTitle'));
    await tick();
    const send = button(baseElement, 'deals.negSend');
    expect(send.disabled).toBe(true); // nothing changed, no reason

    const [, price] = [...baseElement.querySelectorAll('input[type="number"]')] as HTMLInputElement[];
    await fireEvent.input(price, { target: { value: '680' } });
    await tick();
    expect(send.disabled).toBe(true); // a number with no reason is a veto in disguise

    await fireEvent.input(baseElement.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'החומרים עלו' }
    });
    await tick();
    expect(send.disabled).toBe(false);
  });

  it('sends the terms I could sign through counterRatsonProposal, and says it was sent', async () => {
    executeAction.mockResolvedValue({ success: true, data: {} });
    const { baseElement } = render(AcceptWishOffer as any, { props: props() });
    await fireEvent.click(button(baseElement, 'deals.negTitle'));
    await tick();

    const [hours, price] = [...baseElement.querySelectorAll('input[type="number"]')] as HTMLInputElement[];
    await fireEvent.input(hours, { target: { value: '6' } });
    await fireEvent.input(price, { target: { value: '680' } });
    await fireEvent.input(baseElement.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'השולחן דורש שעתיים נוספות' }
    });
    await tick();
    await fireEvent.click(button(baseElement, 'deals.negSend'));

    await waitFor(() => expect(executeAction).toHaveBeenCalledTimes(1));
    expect(executeAction).toHaveBeenCalledWith('counterRatsonProposal', {
      proposalId: '77',
      ratsonId: '16',
      hours: 6,
      price: 680,
      note: 'השולחן דורש שעתיים נוספות'
    });
    await waitFor(() => expect(baseElement.textContent).toContain('deals.negSentTitle'));
  });

  it('shows the server’s own words when the counter is refused, and keeps the form', async () => {
    executeAction.mockResolvedValue({ success: false, error: { message: 'It is the other side’s turn' } });
    const { baseElement } = render(AcceptWishOffer as any, { props: props() });
    await fireEvent.click(button(baseElement, 'deals.negTitle'));
    await tick();
    const [, price] = [...baseElement.querySelectorAll('input[type="number"]')] as HTMLInputElement[];
    await fireEvent.input(price, { target: { value: '680' } });
    await fireEvent.input(baseElement.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'החומרים עלו' }
    });
    await tick();
    await fireEvent.click(button(baseElement, 'deals.negSend'));

    await waitFor(() => expect(baseElement.querySelector('[role="alert"]')?.textContent).toContain('other side'));
    expect(baseElement.querySelector('textarea')).toBeTruthy();
  });
});

describe('AcceptWishOffer — whose move it is', () => {
  const negotiation = (over: Record<string, unknown> = {}) => ({
    canCounter: true,
    round: 1,
    yourTurn: false,
    amount: 6,
    price: 680,
    counters: [{ round: 1, by: 'provider' as const, amount: 6, price: 680, note: 'השולחן דורש שעתיים נוספות' }],
    ...over
  });

  it('after the provider countered it waits for the wisher — no approving their own terms', () => {
    const { baseElement } = render(AcceptWishOffer as any, { props: props({ negotiation: negotiation() }) });
    expect(baseElement.textContent).toContain('deals.negWaiting');
    expect(baseElement.textContent).toContain('השולחן דורש שעתיים נוספות');
    expect(button(baseElement, 'deals.negTitle')).toBeUndefined();
    expect(baseElement.querySelector('.ofr-btn--primary')).toBeNull();
  });

  it('when the wisher put new terms on the table it is the provider’s move again', () => {
    const { baseElement } = render(AcceptWishOffer as any, {
      props: props({
        negotiation: negotiation({
          yourTurn: true,
          counters: [{ round: 1, by: 'wisher' as const, amount: 5, price: 640, note: 'התקציב מאפשר חמש שעות' }]
        })
      })
    });
    expect(baseElement.textContent).toContain('deals.negApproveTheirs');
    expect(button(baseElement, 'deals.negTitle')).toBeTruthy();
    expect(baseElement.textContent).not.toContain('deals.negWaiting');
  });

  it('with no negotiation yet, it behaves as it always did: approve, or counter', () => {
    const { baseElement } = render(AcceptWishOffer as any, { props: props() });
    expect(baseElement.querySelector('.ofr-btn--primary')).toBeTruthy();
    expect(button(baseElement, 'deals.negTitle')).toBeTruthy();
  });
});
