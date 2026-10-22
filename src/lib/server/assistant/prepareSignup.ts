/**
 * An agent prepares a signup (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.1).
 *
 * Someone talking to Claude has no 1lev1 account yet. Claude already knows
 * their name, email, why they came — and often has the rikma drafted. This
 * saves what it knows as a `pending` assistant session (no user yet) and
 * returns one link: /hascama?agent=<token>, the agreement with everything
 * prefilled and the password on the same screen.
 *
 * What the agent can NOT do from here (§5.6): sign, choose a password, confirm
 * an email, or create anything. The session is claimed only by the signatory
 * row created on that screen (§5.4), and only then does anything run.
 *
 * Public by nature (the caller has no account), so: no model call, a hard cap
 * on size, rate limits at the caller (the MCP tool / the route), and an expiry
 * after which cron deletes an unclaimed row.
 */

import { z } from 'zod';
import { parseBlueprint, blueprintToState } from '$lib/assistant/blueprint.js';
import type { AssistantKind, AssistantState } from '$lib/assistant/types.js';
import { countryIdsOf } from '$lib/data/signupCountries.js';
import { createSession, setShare, type StrapiLike } from './session.js';
import { mintSignupToken, SIGNUP_INTENTS, SIGNUP_TOKEN_TTL_MS, type SignupIntent } from './signupToken.js';

const SITE = 'https://www.1lev1.com';
export const CLAIM_DAYS = 14;
const SHARE_DAYS = 30;
/** §5.6: a public call carries at most this many rows. */
export const MAX_PUBLIC_ROWS = 60;

export const PrepareSignupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  countries: z.array(z.union([z.string().max(80), z.number()])).max(5).optional(),
  lang: z.enum(['he', 'en', 'ar', 'ru', 'es']).optional(),
  intent: z.enum(SIGNUP_INTENTS),
  /** join: who they are, what they do — seeds the profile after signup. */
  aboutText: z.string().trim().max(8000).optional(),
  /** order: what they want made or arranged — seeds their wish. */
  wishText: z.string().trim().max(4000).optional(),
  /** business / partnership / idea: the rikma, drafted by the agent. */
  blueprint: z.unknown().optional()
});

export type PrepareSignupInput = z.infer<typeof PrepareSignupSchema>;

export function kindForIntent(intent: SignupIntent): AssistantKind {
  return intent === 'join' ? 'profile' : intent === 'order' ? 'wish' : 'rikma';
}

export interface PrepareSignupResult {
  /** The signup screen — or, for a person who already has an account (§5.7), the page that hands the draft over. */
  signupUrl?: string;
  receiveUrl?: string;
  /** Read-only public rikma preview safe to share with partners or customers. */
  previewUrl?: string;
  /** Behind-the-scenes studio link: edit the rikma, add/remove missions & hours, then sign up and create. */
  manageUrl?: string;
  expiresAt: string;
}

export interface PrepareSignupOptions {
  /** How long the link lives; the public tool keeps the 24h default. */
  tokenTtlMs?: number;
  /**
   * The person already has an account (§5.7): no signup — a link that hands the
   * drafted rikma to that account once they open it signed in.
   */
  receive?: boolean;
}

export async function prepareSignup(
  raw: unknown,
  deps: { strapi: StrapiLike; fetch?: typeof fetch; now?: Date },
  opts: PrepareSignupOptions = {}
): Promise<PrepareSignupResult> {
  const parsed = PrepareSignupSchema.safeParse(raw);
  if (!parsed.success) {
    const where = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
    throw new Error(`Invalid signup details — ${where}`);
  }
  const input = parsed.data;
  const now = deps.now ?? new Date();
  const kind = kindForIntent(input.intent);
  if (opts.receive && (kind !== 'rikma' || input.blueprint === undefined)) {
    throw new Error('Only a drafted rikma (intent business, partnership or idea, with a blueprint) can be prepared for someone who already has an account');
  }

  let state: AssistantState = { items: [] };
  if (kind === 'rikma') {
    if (input.blueprint !== undefined) {
      const bp = parseBlueprint(input.blueprint);
      if ('issues' in bp) {
        throw new Error(`The blueprint is not valid — ${bp.issues.map((i) => `${i.path || '(root)'}: ${i.message}`).join('; ')}`);
      }
      const rows = bp.value.products.length + bp.value.missions.length + bp.value.resources.length + bp.value.partners.length;
      if (rows > MAX_PUBLIC_ROWS) throw new Error(`At most ${MAX_PUBLIC_ROWS} rows before signing up`);
      state = blueprintToState(bp.value, { origin: 'agent' }).state;
    } else {
      state = { items: [], fields: { track: input.intent } };
    }
  }

  const sourceText = kind === 'profile' ? input.aboutText : kind === 'wish' ? input.wishText : input.aboutText;
  const row = await createSession(
    deps.strapi,
    {
      userId: null,
      kind,
      status: 'pending',
      state,
      startedVia: 'agent',
      lang: input.lang ?? 'he',
      sourceText: sourceText ?? null,
      claimEmail: input.email,
      claimExpiresAt: new Date(now.getTime() + CLAIM_DAYS * 86_400_000).toISOString()
    },
    deps.fetch
  );

  let previewUrl: string | undefined;
  if (kind === 'rikma') {
    const key = await setShare(deps.strapi, row.id, { expiresAt: new Date(now.getTime() + SHARE_DAYS * 86_400_000).toISOString() }, deps.fetch);
    previewUrl = `${SITE}/preview/rikma/${key}`;
  }

  const ttl = opts.tokenTtlMs ?? SIGNUP_TOKEN_TTL_MS;
  const token = mintSignupToken(
    {
      sid: row.id,
      name: input.name,
      email: input.email,
      countryIds: countryIdsOf(input.countries ?? []),
      intent: input.intent,
      lang: input.lang ?? 'he',
      ...(opts.receive ? { receive: true } : {})
    },
    now.getTime(),
    undefined,
    ttl
  );

  const manageUrl = kind === 'rikma' ? `${SITE}/preview/rikma/studio/${token}` : undefined;

  return {
    ...(opts.receive ? { receiveUrl: `${SITE}/assistant/receive/${token}` } : { signupUrl: `${SITE}/hascama?agent=${token}` }),
    ...(previewUrl ? { previewUrl } : {}),
    ...(manageUrl ? { manageUrl } : {}),
    expiresAt: new Date(now.getTime() + ttl).toISOString()
  };
}
