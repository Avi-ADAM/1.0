import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { readable } from 'svelte/store';

vi.mock('$lib/translations', () => ({
  t: readable((key: string) => key),
  locale: readable('he'),
  isRtl: readable(true)
}));

import OfflineBanner from './OfflineBanner.svelte';
import { isOnline } from '$lib/stores/network';

describe('OfflineBanner', () => {
  it('says nothing online, explains offline, then announces the return and fades', () => {
    vi.useFakeTimers();
    isOnline.set(true);
    const { queryByRole } = render(OfflineBanner);
    flushSync();
    expect(queryByRole('status')).toBeNull();

    isOnline.set(false);
    flushSync();
    expect(queryByRole('status')?.textContent).toContain('ui.offline.title');

    isOnline.set(true);
    flushSync();
    expect(queryByRole('status')?.textContent).toContain('ui.offline.back');

    vi.advanceTimersByTime(4100);
    flushSync();
    expect(queryByRole('status')).toBeNull();
    vi.useRealTimers();
  });
});
