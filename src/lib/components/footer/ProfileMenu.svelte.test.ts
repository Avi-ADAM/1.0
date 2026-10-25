/**
 * The "more" menu is two-level so it fits a phone: the member's own tools on
 * the first screen, the discovery and explainer pages one tap deeper. Flat, it
 * ran to 18 rows below 400px and grew up past the top of the screen, taking
 * the profile row with it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { readable } from 'svelte/store';

vi.mock('$lib/translations', () => ({
  t: readable((key: string) => key)
}));

const goto = vi.fn();
vi.mock('$app/navigation', () => ({ goto: (p: string) => goto(p) }));

import ProfileMenu from './ProfileMenu.svelte';

const open = async () => {
  const r = render(ProfileMenu);
  await fireEvent.click(r.getByText('common.footer.more'));
  return r;
};

beforeEach(() => goto.mockReset());

describe('ProfileMenu — first screen', () => {
  it('keeps the member tools and leaves the info pages out', async () => {
    const { getByText, queryByText } = await open();
    for (const k of ['profile', 'myActs', 'timers', 'calendar', 'meeting', 'salesCenter']) {
      expect(getByText(`common.footer.${k}`)).toBeTruthy();
    }
    for (const k of ['guide', 'grow', 'quorum', 'consensus', 'why', 'discover_map']) {
      expect(queryByText(`common.footer.${k}`)).toBeNull();
    }
    expect(getByText('common.footer.learnLabel')).toBeTruthy();
    expect(getByText('common.footer.discoverLabel')).toBeTruthy();
  });
});

describe('ProfileMenu — secondary screens', () => {
  it('opens the info pages, navigates, and comes back', async () => {
    const { getByText, queryByText } = await open();
    await fireEvent.click(getByText('common.footer.learnLabel'));
    expect(queryByText('common.footer.myActs')).toBeNull();
    expect(getByText('common.footer.why')).toBeTruthy();

    await fireEvent.click(getByText('common.footer.back'));
    expect(getByText('common.footer.myActs')).toBeTruthy();

    await fireEvent.click(getByText('common.footer.learnLabel'));
    await fireEvent.click(getByText('common.footer.grow'));
    expect(goto).toHaveBeenCalledWith('/grow');
    expect(queryByText('common.footer.grow')).toBeNull();
  });

  it('reopens on the first screen after a close', async () => {
    const { getByText, getAllByText } = await open();
    await fireEvent.click(getByText('common.footer.discoverLabel'));
    expect(getByText('common.footer.discover_map')).toBeTruthy();
    // the toggle tab is the first "more"
    await fireEvent.click(getAllByText('common.footer.more')[0]);
    await fireEvent.click(getAllByText('common.footer.more')[0]);
    expect(getByText('common.footer.myActs')).toBeTruthy();
  });
});
