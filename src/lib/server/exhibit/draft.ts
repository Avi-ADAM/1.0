/**
 * The visitor's rikma, kept for them (docs/inprogress/PLAN_EXHIBITION_MODE.md §7).
 *
 * What `prepareSignup` does for an agent's draft, minus the one thing a fair
 * visitor has not given: their name and email. The draft is saved as a
 * `pending` assistant session with no owner and no claim email; the link that
 * goes on the QR carries a signup token with empty name and email, which the
 * person fills on their own phone, on the agreement screen — the claim is by
 * the token's session id (agent-sign), never by email.
 *
 * Nothing is created on 1lev1 until they sign. An unclaimed draft is deleted
 * by the existing `assistant-cleanup` cron once `claimExpiresAt` passes.
 */
import { blueprintToState, parseBlueprint } from '$lib/assistant/blueprint.js';
import { createSession, setShare, type StrapiLike } from '$lib/server/assistant/session.js';
import { mintSignupToken } from '$lib/server/assistant/signupToken.js';
import { MAX_PUBLIC_ROWS } from '$lib/server/assistant/prepareSignup.js';

/** How long the QR keeps working — the fair, and the weeks after it. */
export const EXHIBIT_DRAFT_DAYS = 30;
const DAY = 86_400_000;
const LANGS = ['he', 'en', 'ar', 'ru', 'es'];

export type ExhibitDraft =
  | { ok: true; sessionId: string; shareKey: string; token: string; expiresAt: string }
  | { ok: false; reason: 'invalid' | 'too-big' };

export async function createExhibitDraft(
  raw: unknown,
  lang: unknown,
  deps: { strapi: StrapiLike; fetch?: typeof fetch; now?: Date }
): Promise<ExhibitDraft> {
  const bp = parseBlueprint(raw);
  if (!bp.ok) return { ok: false, reason: 'invalid' };
  const v = bp.value;
  if (v.fields.track !== 'idea' || v.partners.length) return { ok: false, reason: 'invalid' };
  if (v.products.length + v.missions.length + v.resources.length > MAX_PUBLIC_ROWS) return { ok: false, reason: 'too-big' };

  const now = deps.now ?? new Date();
  const until = new Date(now.getTime() + EXHIBIT_DRAFT_DAYS * DAY).toISOString();
  const language = typeof lang === 'string' && LANGS.includes(lang) ? lang : 'he';

  const row = await createSession(
    deps.strapi,
    {
      userId: null,
      kind: 'rikma',
      status: 'pending',
      state: blueprintToState(v, { origin: 'agent' }).state,
      startedVia: 'agent',
      lang: language,
      sourceText: `Built at the 1lev1 exhibition stand: ${v.fields.name}`,
      claimEmail: null,
      claimExpiresAt: until
    },
    deps.fetch
  );
  const shareKey = (await setShare(deps.strapi, row.id, { expiresAt: until }, deps.fetch))!;
  const token = mintSignupToken(
    { sid: row.id, name: '', email: '', countryIds: [], intent: 'idea', lang: language },
    now.getTime(),
    undefined,
    EXHIBIT_DRAFT_DAYS * DAY
  );
  return { ok: true, sessionId: row.id, shareKey, token, expiresAt: until };
}
