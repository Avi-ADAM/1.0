/**
 * POST /api/vocab/resolve
 * Body:   { skills?: string[], roles?: string[], workways?: string[], lang?: 'he'|'en'|'ar' }
 * Answer: { ok, skills: [{id,name}], roles: [...], workways: [...] }
 *
 * Turns free-text vocabulary into REAL catalogue entries: match against the
 * existing vocabulary, and create what does not exist yet.
 *
 * Why this exists as an endpoint rather than only inside the planning engine:
 * the mission creation form is also reached by a plain URL —
 * `/moach/<id>/create?action=createmission&skills=a,b,c` — which any producer
 * can build (the bot's `prepareMissionTool`, an external MCP agent, a link
 * someone pasted). The form maps chips back to ids against the catalogue it
 * loaded and silently drops what it cannot find, so names arriving that way
 * were shown to the member and then lost on submit. The page calls this before
 * opening the form so those suggestions carry ids like every other path.
 *
 * Auth: a logged-in member only. `/api/vocab/create` is deliberately open (it
 * has to work during anonymous registration), but this endpoint creates several
 * entries per call, so it is gated and capped.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveMissionSpec } from '$lib/server/mission/resolveMissionSpec.js';

type Lang = 'he' | 'en' | 'ar';

/** Enough for a mission's chips; beyond this it is not a mission, it is a list. */
const MAX_TERMS_PER_CATEGORY = 8;
const MAX_TERM_LENGTH = 80;

function asTerms(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of v) {
    const s = String(raw ?? '').trim().slice(0, MAX_TERM_LENGTH);
    const key = s.toLowerCase();
    if (!s || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= MAX_TERMS_PER_CATEGORY) break;
  }
  return out;
}

function asLang(v: unknown): Lang {
  return v === 'en' || v === 'ar' ? v : 'he';
}

export const POST: RequestHandler = async ({ request, fetch, locals }) => {
  if (!locals.tok) throw error(401, 'Log in to resolve vocabulary');

  const body = await request.json().catch(() => ({}));

  const skills = asTerms(body?.skills);
  const roles = asTerms(body?.roles);
  const workways = asTerms(body?.workways);
  if (skills.length === 0 && roles.length === 0 && workways.length === 0) {
    return json({ ok: true, skills: [], roles: [], workways: [] });
  }

  try {
    const resolved = await resolveMissionSpec(
      {
        // The mission name only steers the catalogue-template lookup, which
        // this endpoint does not use; the vocabulary is what matters here.
        name: String(body?.name ?? '').trim(),
        skills,
        roles,
        workways,
        lang: asLang(body?.lang)
      },
      fetch
    );

    return json({
      ok: true,
      skills: resolved.skills.resolved,
      roles: resolved.roles.resolved,
      workways: resolved.workways.resolved
    });
  } catch (err) {
    // Best-effort, like every other vocabulary path: the caller falls back to
    // the plain names and the form's own catalogue lookup.
    console.warn('[vocab/resolve] resolution failed:', err);
    return json({ ok: false, skills: [], roles: [], workways: [] });
  }
};
