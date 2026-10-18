import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { readable } from 'svelte/store';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
  page: {
    params: { projectId: '99' },
    data: { uid: 'user-7' },
    url: { searchParams: new URLSearchParams() }
  }
}));
vi.mock('$lib/translations', () => ({
  t: readable((key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}:${Object.values(vars).join(',')}` : key
  ),
  isRtl: readable(true)
}));

import { goto } from '$app/navigation';
import QuickCreateLauncher from './QuickCreateLauncher.svelte';

const projects = [
  { id: '17', projectName: 'Central rikma', profilePic: null },
  { id: '18', projectName: 'Garden rikma', profilePic: null }
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.mocked(goto).mockReset();
  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ projects })
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(localStorage.getItem).mockReturnValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('QuickCreateLauncher', () => {
  it('does not guess a rikma when there are several, then opens the selected existing form', async () => {
    const view = render(QuickCreateLauncher);
    await fireEvent.click(
      view.getByRole('button', { name: 'common.quickCreate.open' })
    );

    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
    await waitFor(() => expect(dialog.open).toBe(true));
    await waitFor(() =>
      expect(
        view.container.querySelectorAll('[data-quick-project]')
      ).toHaveLength(2)
    );

    const continueButton = view.getByRole('button', {
      name: /common\.quickCreate\.openForm/
    });
    expect((continueButton as HTMLButtonElement).disabled).toBe(true);

    await fireEvent.click(
      view.container.querySelector('[data-quick-project="17"]') as HTMLElement
    );
    expect((continueButton as HTMLButtonElement).disabled).toBe(false);
    await fireEvent.click(
      view.container.querySelector('[data-quick-kind="mission"]') as HTMLElement
    );
    await fireEvent.click(continueButton);

    expect(goto).toHaveBeenCalledWith('/moach/17/create?action=createmission');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/quick-create/projects',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    );
  });

  it('uses Enter on a unique search result to open the existing task form', async () => {
    const view = render(QuickCreateLauncher);
    await fireEvent.click(
      view.getByRole('button', { name: 'common.quickCreate.open' })
    );
    await waitFor(() =>
      expect(
        view.container.querySelectorAll('[data-quick-project]')
      ).toHaveLength(2)
    );

    const search = view.getByRole('searchbox', {
      name: 'common.quickCreate.searchProjects'
    });
    await fireEvent.input(search, { target: { value: 'Central' } });
    expect(
      view.container.querySelectorAll('[data-quick-project]')
    ).toHaveLength(1);
    await fireEvent.keyDown(search, { key: 'Enter' });

    await waitFor(() =>
      expect(goto).toHaveBeenCalledWith('/moach/17/acts?action=createtask')
    );
  });

  it('announces loading and gives a clear empty state when the member has no rikmas', async () => {
    let resolveResponse: (response: unknown) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      })
    );
    const view = render(QuickCreateLauncher);
    await fireEvent.click(
      view.getByRole('button', { name: 'common.quickCreate.open' })
    );

    expect(
      view.container.querySelector('.loading-icon[role="status"]')
    ).not.toBeNull();
    resolveResponse({ ok: true, json: async () => ({ projects: [] }) });
    await waitFor(() =>
      expect(view.getByText('common.quickCreate.noProjects')).toBeTruthy()
    );
    expect(
      view
        .getByRole('link', { name: 'common.quickCreate.browseProjects' })
        .getAttribute('href')
    ).toBe('/moach');
    expect(
      (
        view.getByRole('button', {
          name: 'common.quickCreate.openForm'
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it('offers retry after a project-list error', async () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ projects }) });

    const view = render(QuickCreateLauncher);
    await fireEvent.click(
      view.getByRole('button', { name: 'common.quickCreate.open' })
    );
    await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
    await fireEvent.click(
      view.getByRole('button', { name: 'common.quickCreate.retry' })
    );

    await waitFor(() =>
      expect(
        view.container.querySelectorAll('[data-quick-project]')
      ).toHaveLength(2)
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    logError.mockRestore();
  });

  it('closes on the native dialog cancel event and restores focus to the launcher', async () => {
    const view = render(QuickCreateLauncher);
    const trigger = view.getByRole('button', {
      name: 'common.quickCreate.open'
    });
    await fireEvent.click(trigger);

    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
    await waitFor(() => expect(dialog.open).toBe(true));
    await fireEvent(dialog, new Event('cancel', { cancelable: true }));

    await waitFor(() => expect(dialog.open).toBe(false));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
