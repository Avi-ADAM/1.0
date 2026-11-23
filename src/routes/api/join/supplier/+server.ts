/**
 * POST /api/join/supplier — "supplier in a minute" (docs/inprogress/PLAN_SUPPLIER_GROWTH.md SG1).
 *
 * A guest drafted their business with /api/analyze-business and saw it. This
 * saves the draft, with the service area they drew, as a pending assistant
 * session — the very `prepareSignup` an agent uses — and returns the studio
 * link: the full review screen, editable, ending in sign-up-and-create. Nothing
 * is created in the person's name here; they sign the agreement on that path.
 *
 * Same public-door rules as /api/assistant/prepare-signup: the assistant's kill
 * switch, a few rows an hour per address and a platform-wide daily ceiling.
 * No model call.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';
import { prepareSignup } from '$lib/server/assistant/prepareSignup.js';
import { takePrepare } from '$lib/server/assistant/publicQuota.js';
import { SupplierJoinSchema, withServiceArea, sitePath } from '$lib/assistant/supplierJoin.js';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, fetch, getClientAddress, locals }) => {
  if (env.ASSISTANT_MCP_ENABLED === 'false') return json({ ok: false, reason: 'disabled' }, { status: 404 });
  // A member already has the signed-in path, which creates in their own name.
  if (locals.tok) return json({ ok: false, reason: 'signed-in', next: '/onboard/business' }, { status: 409 });

  const parsed = SupplierJoinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, reason: 'invalid' }, { status: 400 });

  const quota = takePrepare(getClientAddress());
  if (!quota.ok) {
    return json(
      { ok: false, reason: 'rate-limited' },
      { status: 429, headers: { 'Retry-After': String(quota.retryAfterSeconds ?? 60) } }
    );
  }

  const input = parsed.data;
  try {
    const result = await prepareSignup(
      {
        name: input.name,
        email: input.email,
        lang: input.lang,
        intent: 'business',
        aboutText: input.sourceText,
        blueprint: withServiceArea(input.blueprint, input.area)
      },
      { strapi: strapiClient, fetch }
    );
    const next = sitePath(result.manageUrl) ?? sitePath(result.signupUrl);
    if (!next) return json({ ok: false, reason: 'invalid' }, { status: 400 });
    return json({ ok: true, next, expiresAt: result.expiresAt });
  } catch (e) {
    // prepareSignup throws only for a draft it cannot accept (shape, size).
    console.warn('[join/supplier] rejected:', e instanceof Error ? e.message.slice(0, 200) : e);
    return json({ ok: false, reason: 'invalid' }, { status: 400 });
  }
};
