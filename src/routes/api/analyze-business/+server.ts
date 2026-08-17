// POST /api/analyze-business
// Body: { url: string } OR { text: string }, plus optional { lang, withPlan }
// Returns: { ok, name, desc, details, vals[], plan } — the pre-fill payload for
// /me?action=createproject, and the starter planning boards the member will
// review row by row after approving the rikma (PLAN_ONBOARDING Track B).
//
// Two model calls, deliberately separate: the project fields are the critical
// path the member is waiting for, and a failed plan draft must not cost them
// their rikma. The plan is therefore best-effort and comes back `null` on
// failure.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { Agent } from '@mastra/core/agent';
import { createGoogleModel } from '../../../mastra/lib/createModel';
import { fetchSiteSummary } from '$lib/server/planning/siteContext.js';
import { generateSeedPlan, countSeedItems } from '$lib/server/planning/seedPlan.js';

const MIN_TEXT = 50;
/** Enough of a landing page for both the extraction and the plan to be specific. */
const SITE_CHARS = 8000;

type Lang = 'he' | 'en' | 'ar';
type ExtractedBusiness = {
  name: string;
  desc: string;
  details: string;
  vals: string[];
};

const LANG_NAMES: Record<Lang, string> = {
  he: 'Hebrew (עברית)',
  en: 'English',
  ar: 'Arabic (العربية)'
};

/**
 * Read the business's own site.
 *
 * Goes through `fetchSiteSummary` rather than a bare `fetch`: this endpoint
 * takes a URL straight from an onboarding form, and the previous
 * implementation followed redirects to any host — including `127.0.0.1` and
 * the cloud metadata endpoint. The shared helper refuses loopback / private /
 * link-local hosts, re-checks every redirect hop, and caps time and bytes.
 * See `src/lib/server/planning/siteContext.ts`.
 */
async function fetchUrlText(url: string): Promise<string> {
  const site = await fetchSiteSummary(url, { maxChars: SITE_CHARS });
  if (site.ok) return site.text;

  switch (site.error) {
    case 'unusable-url':
    case 'unsafe-redirect':
      throw new Error('That address cannot be read - use a public http(s) website address.');
    case 'timeout':
      throw new Error('The site took too long to answer. Try again, or describe the business instead.');
    case 'not-html':
      throw new Error('That link is not a web page we can read. Try the site home page.');
    case 'empty':
      throw new Error('Could not extract text from page - it may require JavaScript or be empty.');
    default:
      throw new Error('Could not reach the URL - make sure it is publicly accessible.');
  }
}

function stripFences(raw: string): string {
  return (raw ?? '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

/** Same model for both calls; only the instructions differ. */
function makeAgent(id: string, instructions: string): Agent {
  return new Agent({
    id,
    name: id,
    instructions,
    model: createGoogleModel(undefined, 'gemini-3-flash-preview', { thinkingBudget: 0 })
  });
}

async function extractWithGemini(
  text: string,
  sourceHint: 'url' | 'text',
  lang: Lang
): Promise<ExtractedBusiness> {
  const agent = makeAgent(
    'BusinessExtractor',
    'You extract project/business details from a website page or free-text description. Return JSON only - no explanations, no markdown fences.'
  );

  const langName = LANG_NAMES[lang];
  const prompt = `Analyze the following ${sourceHint === 'url' ? 'webpage text' : 'free-text description'} and return JSON ONLY:
{
  "name":    "",   // project/business name (a few words, in ${langName})
  "desc":    "",   // short public description (1-2 sentences, in ${langName})
  "details": "",   // longer description (one paragraph, may use simple HTML like <p>, in ${langName})
  "vals":    []    // 3-7 leading values implied by the text: creativity, honesty, growth, freedom, art...
}

Rules:
- Output language: **ALWAYS ${langName}** (translate if source is a different language).
- Do not invent - if no name is explicit, distill the central topic into a short title.
- vals: short noun phrases (1-2 words). No near-duplicates.
- Do NOT add any other fields.

---
${text.slice(0, 12000)}
---`;

  const result = await agent.generate([{ role: 'user', content: prompt }]);
  const cleaned = stripFences(result.text ?? '');

  try {
    const parsed = JSON.parse(cleaned);
    return {
      name: String(parsed.name ?? '').slice(0, 80),
      desc: String(parsed.desc ?? '').slice(0, 240),
      details: String(parsed.details ?? '').slice(0, 2000),
      vals: Array.isArray(parsed.vals)
        ? parsed.vals.slice(0, 7).map((v: any) => String(v).slice(0, 40))
        : []
    };
  } catch (e) {
    console.error('[analyze-business] parse failed:', cleaned.slice(0, 300));
    throw new Error('AI response could not be parsed. Please try again.');
  }
}

const VALID_LANGS = new Set<Lang>(['he', 'en', 'ar']);
function pickLang(raw: unknown, cookieLang: string | undefined): Lang {
  const candidate = String(raw ?? cookieLang ?? 'he').toLowerCase() as Lang;
  return VALID_LANGS.has(candidate) ? candidate : 'he';
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: { url?: string; text?: string; lang?: string; withPlan?: boolean };
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const lang = pickLang(body.lang, cookies.get('lang'));
  let inputText: string;
  let sourceHint: 'url' | 'text';
  let sourceUrl: string | null = null;

  if (body.url && body.url.trim()) {
    const u = body.url.trim();
    if (!/^https?:\/\//i.test(u)) {
      throw error(400, 'URL must start with http(s)://');
    }
    inputText = await fetchUrlText(u);
    sourceHint = 'url';
    sourceUrl = u;
  } else if (body.text && body.text.trim().length >= MIN_TEXT) {
    inputText = body.text.trim();
    sourceHint = 'text';
  } else {
    throw error(400, `Provide either url or text (at least ${MIN_TEXT} chars).`);
  }

  const extracted = await extractWithGemini(inputText, sourceHint, lang);

  // The starter boards. Best-effort by design - see the file header.
  let plan: { boards: unknown[]; sourceUrl: string | null } | null = null;
  let planItemCount = 0;
  if (body.withPlan !== false) {
    const seed = await generateSeedPlan(
      inputText,
      async (system, user) => {
        const result = await makeAgent('BusinessSeedPlanner', system).generate([
          { role: 'user', content: user }
        ]);
        return result.text ?? '';
      },
      { projectName: extracted.name, siteUsed: sourceUrl }
    );
    if (seed.boards.length > 0) {
      plan = { boards: seed.boards, sourceUrl };
      planItemCount = countSeedItems(seed.boards);
    }
  }

  return json({
    ok: true,
    lang,
    ...extracted,
    plan,
    planBoardCount: plan?.boards.length ?? 0,
    planItemCount
  });
};
