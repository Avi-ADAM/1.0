import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { readable } from 'svelte/store';

vi.mock('$lib/translations', () => ({
  t: readable((key: string) => key)
}));
vi.mock('$lib/stores/lang.js', () => ({ lang: readable('he') }));

const ForumPanel = (await import('./ForumPanel.svelte')).default;

/**
 * QA_CONCIERGE_E2E C-15: the deal page's "reject" pointed at a chat that had no
 * place to write in. The panel can now carry a conversation.
 */

const message = {
  id: '1',
  author: 'דנה',
  initials: 'דנ',
  authorType: 'creator' as const,
  content: 'חתכתי את הלוחות',
  timeAgo: 'היום'
};

describe('ForumPanel — somewhere to write', () => {
  it('is only a log when nobody can write to it', () => {
    const { container } = render(ForumPanel as any, { props: { messages: [message] } });
    expect(container.textContent).toContain('חתכתי את הלוחות');
    expect(container.querySelector('textarea')).toBeNull();
  });

  it('sends what was written, then clears the box', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const { container } = render(ForumPanel as any, { props: { messages: [], onSend } });

    const box = container.querySelector('textarea') as HTMLTextAreaElement;
    await fireEvent.input(box, { target: { value: '  הלוח השני לא הגיע  ' } });
    await fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(onSend).toHaveBeenCalledWith('הלוח השני לא הגיע'));
    await waitFor(() => expect(box.value).toBe(''));
  });

  it('never sends an empty message', async () => {
    const onSend = vi.fn();
    const { container } = render(ForumPanel as any, { props: { messages: [], onSend } });
    expect((container.querySelector('button.send') as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('keeps what was written, and says so, when the message could not be saved', async () => {
    const onSend = vi.fn().mockRejectedValue(new Error('network'));
    const { container } = render(ForumPanel as any, { props: { messages: [], onSend } });

    const box = container.querySelector('textarea') as HTMLTextAreaElement;
    await fireEvent.input(box, { target: { value: 'ננסה שוב' } });
    await fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(container.querySelector('[role="alert"]')).not.toBeNull());
    expect(box.value).toBe('ננסה שוב'); // nothing the member wrote is lost
  });

  it('can be told to bring the writer into focus (what "reject" does)', () => {
    const { container, component } = render(ForumPanel as any, {
      props: { messages: [], onSend: vi.fn() }
    });
    const box = container.querySelector('textarea') as HTMLTextAreaElement;
    (component as any).focus();
    expect(document.activeElement).toBe(box);
  });
});
