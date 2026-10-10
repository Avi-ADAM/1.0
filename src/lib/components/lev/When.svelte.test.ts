/**
 * Render tests for "when did this reach me" (PLAN_LEV_TIMESTAMPS): the card
 * header shows the sentence, the list row shows the bare phrase, and an item
 * without a date shows nothing at all.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import he from '$lib/translations/he/lev.json';

vi.mock('$lib/translations', () => {
  const lookup = (key: string, params: Record<string, string> = {}) => {
    const value = key
      .replace(/^lev\./, '')
      .split('.')
      .reduce((node: any, part) => node?.[part], he);
    if (typeof value !== 'string') return key;
    return value.replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? '');
  };
  return {
    t: { subscribe: (fn: any) => (fn(lookup), () => {}) },
    locale: { subscribe: (fn: any) => (fn('he'), () => {}) },
    isRtl: { subscribe: (fn: any) => (fn(true), () => {}) }
  };
});
vi.mock('$lib/stores/lang.js', () => ({
  lang: { subscribe: (fn: any) => (fn('he'), () => {}) }
}));

const { default: Harness } = await import('./WhenHarness.test.svelte');
const { default: LevRow } = await import('./list/LevRow.svelte');

const { clock } = await import('$lib/stores/clock.svelte');

// Measured from the shared clock, which is floored to the minute (the phrase
// may trail the wall clock by up to 59s — that is the clock's resolution).
const twelveMinutesAgo = () => new Date(clock.minutes - 12 * 60_000 - 30_000).toISOString();

describe('CardHeader inside a LevCard', () => {
  it('shows the sentence under the title, with the full date in its tooltip', () => {
    const at = twelveMinutesAgo();
    const { container } = render(Harness, { props: { item: { ani: 'askedcoin', when: { at } } } });
    const time = container.querySelector('time.lev-when')!;
    expect(time.textContent).toBe('נשלחה לפני 12 דק׳');
    expect(time.getAttribute('datetime')).toBe(new Date(at).toISOString());
    expect(time.getAttribute('title')).toMatch(/\d{4}/);
  });

  it('shows nothing for an item with no date', () => {
    const { container } = render(Harness, { props: { item: { ani: 'askedcoin' } } });
    expect(container.querySelector('time')).toBeNull();
  });
});

describe('LevRow', () => {
  it('puts the bare phrase next to the rikma, the sentence in the tooltip', () => {
    const { container } = render(LevRow, {
      props: {
        item: { ani: 'pends', projectName: 'הרקמה', when: { at: twelveMinutesAgo() } },
        onOpen: () => {}
      }
    });
    const time = container.querySelector('.foot time.lev-when')!;
    expect(time.textContent).toBe('לפני 12 דק׳');
    expect(time.getAttribute('title')).toContain('הוצעה לפני 12 דק׳');
    // The deadline clock in the head is a different thing and stays alone there.
    expect(container.querySelector('.head time')).toBeNull();
  });
});
