import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { readable } from 'svelte/store';

vi.mock('$lib/translations', () => ({
  t: readable((key: string) => key),
  locale: readable('he'),
  isRtl: readable(true)
}));

import ExhibitHandoff from './ExhibitHandoff.svelte';

describe('ExhibitHandoff — the fair QR on the visitor’s phone', () => {
  beforeEach(() => {
    sessionStorage.clear();
    history.replaceState(null, '', '/preview/rikma/k1?ref=exhibit#t=tok.en_1');
  });

  it('reads the token from the fragment, wipes it from the address, and offers signup into the draft', async () => {
    const { findByText, container } = render(ExhibitHandoff, { shareKey: 'k1' });
    await findByText('exhibit.handoff.start');
    expect(location.hash).toBe('');
    expect(location.search).toBe('?ref=exhibit');
    expect(sessionStorage.getItem('exhibit.t.k1')).toBe('tok.en_1');
    const start = container.querySelector('a') as HTMLAnchorElement;
    expect(start.getAttribute('href')).toBe('/hascama?agent=tok.en_1');
  });

  it('survives a reload from sessionStorage', async () => {
    sessionStorage.setItem('exhibit.t.k1', 'tok.en_1');
    history.replaceState(null, '', '/preview/rikma/k1?ref=exhibit');
    const { findByText } = render(ExhibitHandoff, { shareKey: 'k1' });
    await findByText('exhibit.handoff.start');
  });

  it('without a token, says the fair link is no longer active', async () => {
    history.replaceState(null, '', '/preview/rikma/k1?ref=exhibit');
    const { findByText } = render(ExhibitHandoff, { shareKey: 'k1' });
    await findByText('exhibit.handoff.expired');
  });

  it('"keep it for me" sends a phone lead with consent', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);
    const { findByText, container } = render(ExhibitHandoff, { shareKey: 'k1' });
    await fireEvent.click(await findByText('exhibit.handoff.keep'));
    const email = container.querySelector('input[type=email]') as HTMLInputElement;
    await fireEvent.input(email, { target: { value: 'visitor@example.com' } });
    await fireEvent.click(container.querySelector('input[type=checkbox]') as HTMLInputElement);
    await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await findByText('exhibit.handoff.sent');
    const body = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(body).toMatchObject({ t: 'tok.en_1', shareKey: 'k1', email: 'visitor@example.com', consent: true, via: 'phone' });
    vi.unstubAllGlobals();
  });
});
