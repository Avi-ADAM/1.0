/**
 * Render tests for where the heart's deck opens.
 *
 * The deck is a scroll-snap row with a trailing "you're all caught up" slide.
 * When it is built without its cards — or with only some of them — the browser
 * parks on that lone slide and, because mandatory snap re-snaps to the element
 * it was on, stays there when the cards are inserted in front of it. The heart
 * then opened on "caught up / back to start" instead of the first card.
 *
 * happy-dom has no layout, so the scroll position is faked: `getBoundingClientRect`
 * places every slide relative to `parked`, the element the "browser" is on.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Cards from './cards.svelte';

vi.mock('$lib/translations', () => {
  const echo = (key: string) => key;
  return {
    t: { subscribe: (fn: any) => (fn(echo), () => {}) },
    locale: { subscribe: (fn: any) => (fn('he'), () => {}) },
    isRtl: { subscribe: (fn: any) => (fn(true), () => {}) }
  };
});
vi.mock('$app/state', () => ({ page: {} }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

// The neighbours are not under test and each drags in stores of its own.
vi.mock('./LevCard.svelte', async () => ({
  default: (await import('../../prPr/open/__mocks__/Empty.svelte')).default
}));
vi.mock('../LevViewSwitch.svelte', async () => ({
  default: (await import('../../prPr/open/__mocks__/Empty.svelte')).default
}));
vi.mock('./filter.svelte', async () => ({
  default: (await import('../../prPr/open/__mocks__/Empty.svelte')).default
}));
vi.mock('$lib/celim/icons/filterIcon.svelte', async () => ({
  default: (await import('../../prPr/open/__mocks__/Empty.svelte')).default
}));
vi.mock('$lib/celim/ui/button.svelte', async () => ({
  default: (await import('../../prPr/open/__mocks__/Empty.svelte')).default
}));
vi.mock('$lib/celim/Spinner.svelte', async () => ({
  default: (await import('../../prPr/open/__mocks__/Empty.svelte')).default
}));

const card = (id: string) => ({ coinlapach: id, ani: 'pends', projectId: 1 });

/** The element the faked browser is currently snapped to. */
let parked: Element | null = null;
/**
 * How many slides the deck had each time something forced a layout pass. The
 * page root binds `clientWidth`, which reads it from an effect — in a browser
 * that is a synchronous reflow, and whatever the deck holds at that moment is
 * what the scroll-snap container parks on.
 */
let layoutPasses: number[] = [];
let scrolled: Element[] = [];

beforeEach(() => {
  parked = null;
  layoutPasses = [];
  scrolled = [];
  sessionStorage.clear?.();

  (globalThis as any).IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      const deck = this.querySelector('.deck');
      if (deck) layoutPasses.push(deck.children.length);
      return 1000;
    }
  });
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {}
  })) as any;

  Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
    scrolled.push(this);
    parked = this;
  });
  // Deck: 1000px wide at the origin. A slide sits 1000px per position away from
  // whichever one is `parked`, so the parked one is exactly centred.
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const box = (left: number) => ({
      left,
      top: 0,
      width: 1000,
      height: 700,
      right: left + 1000,
      bottom: 700,
      x: left,
      y: 0,
      toJSON() {}
    });
    if (this.classList?.contains('deck-slide') && this.parentElement) {
      const kids = [...this.parentElement.children];
      const at = kids.indexOf(this);
      const base = parked ? kids.indexOf(parked) : 0;
      return box((at - base) * 1000) as DOMRect;
    }
    return box(0) as DOMRect;
  };
});

const deckOf = (container: HTMLElement) =>
  container.querySelector('.deck') as HTMLElement;

/**
 * Every callback prop is optional at runtime; the generated `Props` type just
 * can't say so, hence the cast.
 */
function mount(arr1: unknown[]) {
  const r = render(Cards, { props: { arr1 } as any });
  return {
    container: r.container,
    feed: (next: unknown[]) => r.rerender({ arr1: next } as any)
  };
}

describe('heart deck — where it opens', () => {
  it('is never built with only the end-of-line slide once there are cards', async () => {
    const { feed } = mount([]);
    await feed([card('a'), card('b'), card('c')]);
    await tick();

    // Every layout pass saw the full set: 3 cards + the end slide.
    expect(layoutPasses.length).toBeGreaterThan(0);
    expect(layoutPasses).not.toContain(1);
    expect(layoutPasses.at(-1)).toBe(4);
  });

  it('opens on the first card when the deck was parked on the end slide', async () => {
    // Nothing renderable yet, so the deck exists with only the end slide and the
    // browser is on it.
    const { container, feed } = mount([{ coinlapach: 'junk', ani: 'not-a-card' }]);
    await tick();
    parked = deckOf(container).children[0];

    await feed([card('a'), card('b'), card('c')]);
    await tick();

    const deck = deckOf(container);
    expect(deck.children.length).toBe(4);
    expect(scrolled.at(-1)).toBe(deck.children[0]);
    expect((scrolled.at(-1) as HTMLElement).dataset.id).toBe('a');
  });

  it('holds the top of the feed while cards stream in ahead of the first one', async () => {
    const { container, feed } = mount([card('a')]);
    await tick();
    const a = deckOf(container).children[0];
    parked = a; // the browser is on `a`, which is what the keyed {#each} keeps

    // A more urgent card lands in front of it.
    await feed([card('z'), card('a')]);
    await tick();

    const deck = deckOf(container);
    expect(deck.children[1]).toBe(a);
    expect((scrolled.at(-1) as HTMLElement).dataset.id).toBe('z');
  });

  it('stops pinning once the reader has put a hand on the deck', async () => {
    const { container, feed } = mount([card('a')]);
    await tick();
    const a = deckOf(container).children[0];
    parked = a;
    scrolled = [];

    await fireEvent.pointerDown(deckOf(container));
    await feed([card('z'), card('a')]);
    await tick();

    expect(scrolled).toEqual([]);
  });
});
