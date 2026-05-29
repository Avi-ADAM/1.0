// POST /api/analyze-business
// Body: { url: string } OR { text: string }
// Returns: { ok, name, desc, details, vals[] } — pre-fill payload for /me?action=createproject

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { Agent } from '@mastra/core/agent';
import { createGoogleModel } from '../../../mastra/lib/createModel';

const MAX_HTML = 60_000;
const MIN_TEXT = 50;

function stripTags(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchUrlText(url: string): Promise<string> {
  let resp: Response;
  try {
    resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 1lev1-onboard/1.0)',
        Accept: 'text/html,application/xhtml+xml'
      },
      redirect: 'follow'
    });
  } catch (e) {
    throw new Error('Could not reach the URL — make sure it is publicly accessible.');
  }
  if (!resp.ok) {
    throw new Error(`Site responded ${resp.status} — it may be private or blocking bots.`);
  }
  const html = await resp.text();
  const text = stripTags(html).slice(0, MAX_HTML);
  if (text.length < MIN_TEXT) {
    throw new Error('Could not extract text from page — it may require JavaScript or be empty.');
  }
  return text;
}

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

async function extractWithGemini(text: string, sourceHint: 'url' | 'text', lang: Lang): Promise<ExtractedBusiness> {
  const agent = new Agent({
    id: 'BusinessExtractor',
    name: 'BusinessExtractor',
    instructions:
      'You extract project/business details from a website page or free-text description. Return JSON only — no explanations, no markdown fences.',
    model: createGoogleModel(undefined, 'gemini-flash-latest', { thinkingBudget: 0 })
  });

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
- Do not invent — if no name is explicit, distill the central topic into a short title.
- vals: short noun phrases (1-2 words). No near-duplicates.
- Do NOT add any other fields.

---
${text.slice(0, 12000)}
---`;

  const result = await agent.generate([{ role: 'user', content: prompt }]);

  const cleaned = (result.text ?? '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      name: String(parsed.name ?? '').slice(0, 80),
      desc: String(parsed.desc ?? '').slice(0, 240),
      details: String(parsed.details ?? '').slice(0, 2000),
      vals: Array.isArray(parsed.vals) ? parsed.vals.slice(0, 7).map((v: any) => String(v).slice(0, 40)) : []
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
  let body: { url?: string; text?: string; lang?: string };
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const lang = pickLang(body.lang, cookies.get('lang'));
  let inputText: string;
  let sourceHint: 'url' | 'text';

  if (body.url && body.url.trim()) {
    const u = body.url.trim();
    if (!/^https?:\/\//i.test(u)) {
      throw error(400, 'URL must start with http(s)://');
    }
    inputText = await fetchUrlText(u);
    sourceHint = 'url';
  } else if (body.text && body.text.trim().length >= MIN_TEXT) {
    inputText = body.text.trim();
    sourceHint = 'text';
  } else {
    throw error(400, `Provide either url or text (at least ${MIN_TEXT} chars).`);
  }

  const extracted = await extractWithGemini(inputText, sourceHint, lang);
  return json({ ok: true, lang, ...extracted });
};
