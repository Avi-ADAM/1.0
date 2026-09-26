/**
 * The agent-prepared signup screen: the prefill is editable, a name from the
 * link is never HTML, and nothing is sent until the person signs and chooses a
 * password — then the signature first, the ordinary /signup form second.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { readable } from 'svelte/store';

vi.mock('$lib/translations', () => ({
  t: readable((key: string, payload?: Record<string, unknown>) =>
    key === 'home.amana.agreement.basicText1' ? `אני <strong>${payload?.name}</strong> מסכים/ה` : key
  ),
  locale: readable('he')
}));

import AgentSignup from './AgentSignup.svelte';

const prefill = {
  name: '<img src=x onerror=alert(1)>',
  email: 'dana@x.co',
  countries: [{ id: 104, label: 'Israel', heb: 'ישראל' }],
  intent: 'business',
  lang: 'he'
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('AgentSignup', () => {
  it('shows the prefill, and a name from the link is text, not markup', () => {
    const { container } = render(AgentSignup, { props: { token: 't', prefill } });
    expect((container.querySelector('input[type="email"]') as HTMLInputElement).value).toBe('dana@x.co');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.agreement p')?.innerHTML).toContain('&lt;img');
  });

  it('sends nothing until signed with a valid password', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { getByText, getByRole } = render(AgentSignup, { props: { token: 't', prefill } });
    await fireEvent.click(getByRole('button', { name: 'home.amana.agent.submit' }));
    expect(getByText('home.amana.agent.errors.agreement')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('signs first, then posts the ordinary signup form', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, chezinId: 77, countries: [104] }), { status: 200 })
    );
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
    const { container, getByRole } = render(AgentSignup, { props: { token: 'tok', prefill: { ...prefill, name: 'דנה' } } });

    await fireEvent.click(container.querySelector('.check input') as HTMLInputElement);
    const [pw, pw2] = container.querySelectorAll('input[type="password"]');
    await fireEvent.input(pw, { target: { value: 'Secret123' } });
    await fireEvent.input(pw2, { target: { value: 'Secret123' } });
    await fireEvent.click(getByRole('button', { name: 'home.amana.agent.submit' }));
    await vi.waitFor(() => expect(submit).toHaveBeenCalled());

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/assistant/agent-sign');
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ t: 'tok', name: 'דנה', email: 'dana@x.co', countries: [104], agreed: true });
    const form = container.querySelector('form[action^="/signup"]') as HTMLFormElement;
    expect(form.getAttribute('action')).toBe('/signup?fp=77&con=104');
    expect((form.querySelector('input[name="password"]') as HTMLInputElement).value).toBe('Secret123');
    expect(document.cookie).toContain('reg_intent=agent');
  });
});
