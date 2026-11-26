/**
 * The kiosk's side of "take it home" (docs/inprogress/PLAN_EXHIBITION_MODE.md §7):
 * ask the server to keep the signed rikma as a draft, build the link that goes
 * on the QR, and send "keep it for me" from the stand.
 *
 * Every call has a deadline and answers null / false instead of throwing —
 * the last screen never waits on the network: without a draft the QR simply
 * points at the public /vision page.
 */
import type { ExhibitIdea } from './types';

export const DRAFT_TIMEOUT_MS = 10_000;

export interface Draft {
  shareKey: string;
  token: string;
}

async function post(url: string, body: unknown, timeoutMs: number, fetchImpl: typeof fetch): Promise<any | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    const data = await res.json().catch(() => null);
    return res.ok && data?.ok ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * What only the stand knows about the idea, for the lead the team will read
 * (§9 G1): `template:<key>` / `ai` / `nearest:<key>`, and the visitor's words.
 */
export function ideaMeta(idea: ExhibitIdea | null): { source: string | null; words: string | null } {
  if (!idea) return { source: null, words: null };
  const words = idea.key === 'custom' ? idea.title : null;
  if (idea.source === 'ai') return { source: 'ai', words };
  if (!idea.basedOn) return { source: null, words };
  return { source: `${idea.key === 'custom' ? 'nearest' : 'template'}:${idea.basedOn}`, words };
}

export async function requestDraft(
  blueprint: unknown,
  lang: string,
  {
    timeoutMs = DRAFT_TIMEOUT_MS,
    fetchImpl = fetch,
    meta = null
  }: { timeoutMs?: number; fetchImpl?: typeof fetch; meta?: { source: string | null; words: string | null } | null } = {}
): Promise<Draft | null> {
  const data = await post('/api/exhibit/draft', { blueprint, lang, ...(meta ? { meta } : {}) }, timeoutMs, fetchImpl);
  return data && typeof data.shareKey === 'string' && typeof data.token === 'string'
    ? { shareKey: data.shareKey, token: data.token }
    : null;
}

export async function sendLead(
  draft: Draft,
  contact: { name?: string; email?: string; phone?: string },
  via: 'kiosk' | 'phone',
  { timeoutMs = DRAFT_TIMEOUT_MS, fetchImpl = fetch }: { timeoutMs?: number; fetchImpl?: typeof fetch } = {}
): Promise<{ ok: boolean; mailed: boolean }> {
  const data = await post(
    '/api/exhibit/lead',
    { t: draft.token, shareKey: draft.shareKey, ...contact, consent: true, via },
    timeoutMs,
    fetchImpl
  );
  // `mailed`: the server sent the idea and its link to the address given.
  return { ok: !!data, mailed: !!data?.mailed };
}

/**
 * Where the QR leads. The token rides in the fragment (`#t=`): a fragment never
 * reaches a server, a log or a Referer header, and the page drops it from the
 * address bar once read, so sharing the preview does not share the claim.
 */
export function handoffUrl(origin: string, draft: Draft | null, lang: string): string {
  const q = `ref=exhibit&lang=${encodeURIComponent(lang)}`;
  return draft
    ? `${origin}/preview/rikma/${encodeURIComponent(draft.shareKey)}?${q}#t=${draft.token}`
    : `${origin}/vision?${q}`;
}

/** The phone page reads the token back from the fragment. */
export function tokenFromHash(hash: string): string | null {
  const m = /(?:^#|&)t=([A-Za-z0-9_\-.]+)/.exec(hash ?? '');
  return m ? m[1] : null;
}
