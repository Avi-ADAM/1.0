import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readable } from 'svelte/store';

/**
 * PLAN_DIRECT_OFFER §4.3 — the owner changes her published wish's terms. The form
 * says what that does before she saves, and sends only what she changed.
 */

const invalidateAll = vi.fn();
vi.mock('$app/navigation', () => ({ invalidateAll: () => invalidateAll() }));
vi.mock('svelte-sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock('$lib/translations', () => ({
  t: readable((key: string, vars?: Record<string, unknown>) => (vars ? `${key} ${JSON.stringify(vars)}` : key))
}));

const WishTermsEditor = (await import('./WishTermsEditor.svelte')).default;

const wish = {
  id: '16',
  name: 'אתר לסטודיו',
  longDes: '<p>אתר תדמית</p><p>עם גלריה</p>',
  startDate: '2026-11-01T00:00:00.000Z',
  finnishDate: '2026-12-01T00:00:00.000Z',
  isOnline: false,
  locationHint: 'חיפה'
};

const fetchMock = vi.fn();

function open() {
  const view = render(WishTermsEditor as any, { props: { wish } });
  return { view, click: () => fireEvent.click(view.getByText(/concierge.terms_edit/)) };
}

describe('WishTermsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({ json: async () => ({ success: true, data: { reopened: 1 } }) });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('opens on the wish as it stands, and says that signatures will be asked again', async () => {
    const { view, click } = open();
    await click();
    await tick();
    expect(view.container.textContent).toContain('concierge.terms_note');
    const [name] = view.container.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
    expect(name.value).toBe('אתר לסטודיו');
    const textarea = view.container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('אתר תדמית\n\nעם גלריה');
    const [from, until] = view.container.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>;
    expect([from.value, until.value]).toEqual(['2026-11-01', '2026-12-01']);
  });

  it('sends only what changed', async () => {
    const { view, click } = open();
    await click();
    await tick();
    const until = view.container.querySelectorAll('input[type="date"]')[1] as HTMLInputElement;
    await fireEvent.input(until, { target: { value: '2026-12-15' } });
    await fireEvent.submit(view.container.querySelector('form')!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      actionKey: 'updateWishTerms',
      params: { ratsonId: '16', finnishDate: '2026-12-15T00:00:00.000Z' }
    });
    await waitFor(() => expect(invalidateAll).toHaveBeenCalled());
  });

  it('a changed description goes back as paragraphs, escaped', async () => {
    const { view, click } = open();
    await click();
    await tick();
    const textarea = view.container.querySelector('textarea') as HTMLTextAreaElement;
    await fireEvent.input(textarea, { target: { value: 'אתר <b>חדש</b>\n\nעם בלוג' } });
    await fireEvent.submit(view.container.querySelector('form')!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.params.longDes).toBe('<p>אתר &lt;b&gt;חדש&lt;/b&gt;</p><p>עם בלוג</p>');
  });

  it('saving nothing changed sends nothing', async () => {
    const { view, click } = open();
    await click();
    await tick();
    await fireEvent.submit(view.container.querySelector('form')!);
    await tick();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
