/**
 * POST /api/vision-preview — the /vision page's "see your idea as a rikma".
 *
 * Body: { text, lang?, website? }. A visitor with no account describes their
 * idea; one model call drafts the starter boards business onboarding uses
 * (`generateSeedPlan`), and `boardsToVisionPreview` cuts them down to the few
 * rows a landing page shows. Nothing is stored and nothing is created — the
 * full draft is what signing up (or an agent's prepareSignup) is for.
 *
 * Public, and it spends a model call, so it is the most guarded door on the
 * site's marketing pages:
 *  - text is 60–1500 characters (enough to describe an idea, not a document);
 *  - `website` is a honeypot — a form field people never see, which bots fill;
 *  - each address gets 3 tries an hour and 10 a day, and the whole site 200 a
 *    day, after which the page points at signing up or an AI agent instead.
 * The limiters are in-process: /api runs as one container on the VPS (the
 * browser's /api calls are routed there), so they hold across visitors.
 *
 * The text is untrusted data; the seed prompt fences it and says so, and the
 * reply is parsed into plain rows, never rendered as markup.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateSeedPlan } from '$lib/server/planning/seedPlan.js';
import { boardsToVisionPreview, isEmptyPreview } from '$lib/vision/preview';
import { RateLimiter, callerKey } from '$lib/server/translation/rateLimit';

// Not exported: a +server module may export only its handlers.
const MIN_TEXT = 60;
const MAX_TEXT = 1500;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const PER_HOUR = 3;
const PER_DAY = 10;
const SITE_PER_DAY = 200;

/*
 * The page's point is the split each mission starts with, which needs hours
 * and a rate on every mission. Onboarding's planner may leave them empty; here
 * a rough estimate is the whole demonstration, and the page labels it as one.
 */
const PREVIEW_RULE = `## This draft is a quick public preview
Every "mission" row MUST carry "nhours" (a realistic total estimate) and
"valph" (a typical hourly rate for that kind of work, in the currency usual
for the language of the text). They are rough illustrations the founder will
edit, so estimate rather than leave them empty.`;

const perAddress = new RateLimiter();
const site = new RateLimiter({ maxKeys: 10 });
const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };

function refuse(reason: string, status: number, retryAfterMs = 0) {
  const headers: Record<string, string> = { ...HEADERS };
  if (retryAfterMs) headers['Retry-After'] = String(Math.ceil(retryAfterMs / 1000));
  return json({ ok: false, reason }, { status, headers });
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  let body: { text?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return refuse('bad-request', 400);
  }

  // A filled honeypot gets the same answer as a too-short text: nothing to probe.
  if (typeof body.website === 'string' && body.website.trim()) return refuse('too-short', 400);

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (text.length < MIN_TEXT) return refuse('too-short', 400);
  if (text.length > MAX_TEXT) return refuse('too-long', 400);

  const who = callerKey(undefined, getClientAddress());
  const hour = perAddress.take(`h:${who}`, PER_HOUR, HOUR);
  if (!hour.ok) return refuse('rate-limited', 429, hour.retryAfterMs);
  const day = perAddress.take(`d:${who}`, PER_DAY, DAY);
  if (!day.ok) return refuse('rate-limited', 429, day.retryAfterMs);
  const all = site.take('vision:all', SITE_PER_DAY, DAY);
  if (!all.ok) return refuse('busy', 429, all.retryAfterMs);

  const [{ Agent }, { createModelChain }] = await Promise.all([
    import('@mastra/core/agent'),
    import('../../../mastra/lib/createModel')
  ]);

  const seed = await generateSeedPlan(text, async (system, user) => {
    const agent = new Agent({
      id: 'VisionPreviewPlanner',
      name: 'VisionPreviewPlanner',
      instructions: `${system}\n\n${PREVIEW_RULE}`,
      model: createModelChain()
    });
    const result = await agent.generate([{ role: 'user', content: user }]);
    return result.text ?? '';
  });

  const preview = boardsToVisionPreview(seed.boards);
  if (isEmptyPreview(preview)) return refuse('empty', 422);

  return json({ ok: true, preview }, { headers: HEADERS });
};
