/**
 * The living-list panel: every tap is an op sent with the version it saw, a
 * row a supplier answered offers no controls, and "save" is one call.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { readable } from 'svelte/store';

vi.mock('$lib/translations', () => ({
  t: readable((key: string) => key)
}));

const executeAction = vi.fn();
vi.mock('$lib/client/actionClient', () => ({
  executeAction: (...args: unknown[]) => executeAction(...args)
}));

import AssistantPanel from './AssistantPanel.svelte';

const session = {
  sessionId: '9',
  kind: 'wish' as const,
  version: 4,
  items: [
    { key: 'w1', group: 'wishMissions', label: 'צלם', status: 'applied' },
    { key: 'w2', group: 'wishMissions', label: 'DJ', status: 'applied', committed: {} }
  ],
  recent: [{ via: 'agent', instruction: 'x' }]
};

beforeEach(() => executeAction.mockReset());

describe('AssistantPanel', () => {
  it('"not now" is an op with the version I saw; an answered row has no controls', async () => {
    executeAction.mockResolvedValue({ success: true, data: { ...session, version: 5, items: [{ ...session.items[0], status: 'dropped' }, session.items[1]] } });
    const { getByRole, queryByRole, getByText } = render(AssistantPanel, { props: { session } });
    expect(getByText('assistant.viaAgent')).toBeTruthy();
    expect(queryByRole('button', { name: 'assistant.notNow DJ' })).toBeNull();

    await fireEvent.click(getByRole('button', { name: 'assistant.notNow צלם' }));
    expect(executeAction).toHaveBeenCalledWith(
      'setAssistantItems',
      { sessionId: '9', ops: [{ op: 'drop', key: 'w1' }], expectedVersion: 4, via: 'site' },
      { showErrorToast: false }
    );
    await vi.waitFor(() => expect(getByRole('button', { name: 'assistant.restore' })).toBeTruthy());
  });

  it('words go to revise; save is one apply call', async () => {
    executeAction.mockResolvedValue({ success: true, data: { ...session, say: 'הוספתי מנחה', applied: true } });
    const { getByRole, getByLabelText, findByText } = render(AssistantPanel, { props: { session } });
    await fireEvent.input(getByLabelText('assistant.sayLabel'), { target: { value: 'תוסיף מנחה' } });
    await fireEvent.click(getByRole('button', { name: 'assistant.send' }));
    expect(executeAction.mock.calls[0][0]).toBe('reviseAssistantSession');
    expect(await findByText(/הוספתי מנחה/)).toBeTruthy();

    await fireEvent.click(getByRole('button', { name: 'assistant.apply.wish' }));
    expect(executeAction.mock.calls[1][0]).toBe('applyAssistantSession');
  });
});
