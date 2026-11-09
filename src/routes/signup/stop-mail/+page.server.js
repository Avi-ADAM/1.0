import { fail } from '@sveltejs/kit';

// A button and not the link itself: mail scanners open every link they find,
// and that must not unsubscribe anyone.
export const actions = {
  default: async ({ url, fetch }) => {
    const res = await fetch('/api/chezin/continue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop', t: url.searchParams.get('t') })
    }).catch(() => null);
    const body = res?.ok ? await res.json().catch(() => null) : null;
    return body?.ok ? { done: true } : fail(400, { invalid: true });
  }
};
