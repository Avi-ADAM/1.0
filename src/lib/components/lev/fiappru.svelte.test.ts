import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readable } from 'svelte/store';

/**
 * QA_CONCIERGE_E2E C-15 on the card: the 🤝 button did nothing, and the only
 * other way to disagree with a finish approval was a veto. Now disagreeing is a
 * counter — hours + a reason — sent through `counterFiniapruval`.
 */

const noop = () => {};
const toast = { success: vi.fn(), error: vi.fn(), message: vi.fn() };

// happy-dom has no Web Animations; the dialog's `fly` would call element.animate.
vi.mock('svelte/transition', () => ({ fly: () => ({ duration: 0 }) }));
vi.mock('svelte-sonner', () => ({ toast }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidateAll: vi.fn() }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/lev') } }));
vi.mock('$lib/translations', () => ({
  t: readable((key: string, vars?: Record<string, unknown>) =>
    vars ? `${key} ${JSON.stringify(vars)}` : key
  ),
  isRtl: readable(true)
}));
vi.mock('$lib/stores/lang.js', () => ({ lang: readable('he') }));
vi.mock('progressbar-svelte', () => ({ ProgressBar: noop }));
vi.mock('vaul-svelte', () => ({
  Drawer: { Root: noop, Trigger: noop, Portal: noop, Overlay: noop, Content: noop }
}));
vi.mock('swiper/svelte', () => ({ Swiper: noop, SwiperSlide: noop }));
vi.mock('swiper', () => ({ EffectFlip: {}, Navigation: {} }));
vi.mock('swiper/css', () => ({}));
vi.mock('swiper/css/effect-flip', () => ({}));
vi.mock('./style.css', () => ({}));
vi.mock('./cards/timetToTimegrama.svelte', () => ({ default: noop }));
vi.mock('./cards/CardHeader.svelte', () => ({ default: noop }));
vi.mock('./cards/VoteStatusDisplay.svelte', () => ({ default: noop }));
vi.mock('$lib/stores/projectStore', () => ({ getProjectData: () => [] }));
vi.mock('$lib/celim/lowbtn.svelte', () => ({ default: noop }));

const Fiappru = (await import('./fiappru.svelte')).default;

const props = (over: Record<string, unknown> = {}) => ({
  cards: true,
  askId: '77',
  projectId: '5',
  coinlapach: 'fiapp-77',
  mId: '9',
  nhours: 5,
  valph: 100,
  already: false,
  noofusersOk: 1,
  noofusersNo: 0,
  noofusersWaiting: 2,
  noofpu: 3,
  uids: [],
  users: [],
  round: 0,
  counters: [],
  why: 'חיתכתי את הלוחות',
  ...over
});

function mockFetch(answer: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ json: async () => answer });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** The 🤝 button of the card footer — the one between "no" and "approve". */
const negoButton = (c: HTMLElement) =>
  [...c.querySelectorAll('button')].find((b) => b.getAttribute('class')?.includes('border-yellow-500')) as HTMLElement;

describe('fiappru — disagreeing is a counter, never a veto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('has no flat "no" any more — only the 🤝 and the approval', () => {
    const { container } = render(Fiappru as any, { props: props() });
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons.some((b) => b.getAttribute('class')?.includes('border-red-500'))).toBe(false);
    expect(negoButton(container)).toBeTruthy();
  });

  it('the 🤝 opens the counter form, prefilled with the hours on the table', async () => {
    const { baseElement, container } = render(Fiappru as any, { props: props() });
    await fireEvent.click(negoButton(container));
    await tick();

    const hours = baseElement.querySelector('input[type="number"]') as HTMLInputElement;
    expect(hours).toBeTruthy();
    expect(Number(hours.value)).toBe(5);
    expect(baseElement.textContent).toContain('lev.fiappru.counterHeading');
  });

  it('will not send a counter that changes nothing or says nothing', async () => {
    const { baseElement, container } = render(Fiappru as any, { props: props() });
    await fireEvent.click(negoButton(container));
    await tick();
    const send = [...baseElement.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('counterSend')
    ) as HTMLButtonElement;
    expect(send.disabled).toBe(true); // same hours, no reason

    const hours = baseElement.querySelector('input[type="number"]') as HTMLInputElement;
    await fireEvent.input(hours, { target: { value: '3' } });
    await tick();
    expect(send.disabled).toBe(true); // a number with no reason is a veto in disguise

    const note = baseElement.querySelector('textarea') as HTMLTextAreaElement;
    await fireEvent.input(note, { target: { value: 'שלוש שעות זה מה שראיתי' } });
    await tick();
    expect(send.disabled).toBe(false);
  });

  it('sends the version I would sign through counterFiniapruval, and the card leaves like after approving', async () => {
    const fetchMock = mockFetch({ success: true, data: { success: true } });
    const onDecline = vi.fn();
    const { baseElement, container } = render(Fiappru as any, { props: props({ onDecline }) });

    await fireEvent.click(negoButton(container));
    await tick();
    await fireEvent.input(baseElement.querySelector('input[type="number"]') as HTMLInputElement, {
      target: { value: '3' }
    });
    await fireEvent.input(baseElement.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'שלוש שעות זה מה שראיתי' }
    });
    await tick();
    const send = [...baseElement.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('counterSend')
    ) as HTMLButtonElement;
    await fireEvent.click(send);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/action');
    expect(JSON.parse(init.body)).toEqual({
      actionKey: 'counterFiniapruval',
      params: { finiapruvalId: '77', projectId: '5', hours: 3, note: 'שלוש שעות זה מה שראיתי' }
    });
    await waitFor(() => expect(onDecline).toHaveBeenCalledWith({ ani: 'fini', coinlapach: 'fiapp-77' }));
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows the server’s own words when the counter is refused, and keeps the form', async () => {
    mockFetch({ success: false, error: { message: 'You already stand behind the current version' } });
    const onDecline = vi.fn();
    const { baseElement, container } = render(Fiappru as any, { props: props({ onDecline }) });

    await fireEvent.click(negoButton(container));
    await tick();
    await fireEvent.input(baseElement.querySelector('input[type="number"]') as HTMLInputElement, {
      target: { value: '3' }
    });
    await fireEvent.input(baseElement.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'שלוש שעות זה מה שראיתי' }
    });
    await tick();
    await fireEvent.click(
      [...baseElement.querySelectorAll('button')].find((b) => b.textContent?.includes('counterSend')) as HTMLElement
    );

    await waitFor(() =>
      expect(baseElement.querySelector('[role="alert"]')?.textContent).toContain('already stand behind')
    );
    expect(onDecline).not.toHaveBeenCalled();
    expect(baseElement.querySelector('textarea')).toBeTruthy(); // the form is still there to fix
  });

  it('tells the negotiation so far on the card', () => {
    const { container } = render(Fiappru as any, {
      props: props({
        round: 1,
        nhours: 3,
        counters: [{ round: 1, userId: '2', from: 5, to: 3, note: 'שלוש שעות זה מה שראיתי' }]
      })
    });
    expect(container.textContent).toContain('lev.fiappru.counterRound');
    expect(container.textContent).toContain('שלוש שעות זה מה שראיתי');
  });
});
