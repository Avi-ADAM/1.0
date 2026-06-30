/**
 * POST /api/mission/describe
 *
 * Two modes:
 *   - mode: 'improve'   — Gemini rewrites the description in the same language,
 *                         richer and more compelling.
 *   - mode: 'translate' — Returns { he, en, ar } translations for preview.
 *
 * Body: { text: string, mode: 'improve'|'translate', lang?: 'he'|'en'|'ar' }
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Agent } from '@mastra/core/agent';
import { createGoogleModel } from '../../../../mastra/lib/createModel';

type Lang = 'he' | 'en' | 'ar';
const VALID_LANGS = new Set<Lang>(['he', 'en', 'ar']);
function pickLang(raw: unknown, cookieLang: string | undefined): Lang {
  const candidate = String(raw ?? cookieLang ?? 'he').toLowerCase() as Lang;
  return VALID_LANGS.has(candidate) ? candidate : 'he';
}

const LANG_NAMES: Record<Lang, string> = {
  he: 'Hebrew (עברית)',
  en: 'English',
  ar: 'Arabic (العربية)'
};

function makeAgent() {
  return new Agent({
    id: 'MissionDescriptionEditor',
    name: 'MissionDescriptionEditor',
    instructions:
      'You improve and translate mission descriptions. Return only the requested output — no extra commentary.',
    model: createGoogleModel(undefined, 'gemini-flash-latest', { thinkingBudget: 0 })
  });
}

// ── Improve ───────────────────────────────────────────────────────────────────

async function improve(text: string, lang: Lang): Promise<string> {
  const agent = makeAgent();
  const langName = LANG_NAMES[lang];
  const prompt = `Improve the following mission description. Keep the same language (${langName}). Make it more engaging, specific, and clear. You may use simple HTML like <p>, <strong>, <ul>, <li>. Preserve all facts. Return ONLY the improved description text (may include HTML).

Original:
${text}`;

  const result = await agent.generate([{ role: 'user', content: prompt }]);
  return (result.text ?? '').trim().slice(0, 5000);
}

// ── Translate ─────────────────────────────────────────────────────────────────

async function translateAll(
  text: string
): Promise<Record<Lang, string>> {
  const agent = makeAgent();

  const prompt = `Translate the following mission description into all three languages. Return JSON ONLY:
{
  "he": "...",
  "en": "...",
  "ar": "..."
}

Rules:
- Preserve HTML tags (<p>, <strong>, <ul>, <li>, etc.)
- Keep all facts intact
- he = Hebrew, en = English, ar = Arabic
- Return ONLY the JSON object

Text to translate:
${text}`;

  const result = await agent.generate([{ role: 'user', content: prompt }]);
  const cleaned = (result.text ?? '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      he: String(parsed.he ?? '').slice(0, 5000),
      en: String(parsed.en ?? '').slice(0, 5000),
      ar: String(parsed.ar ?? '').slice(0, 5000),
    };
  } catch (e) {
    console.error('[mission/describe] translate parse failed:', cleaned.slice(0, 300));
    throw new Error('AI response could not be parsed. Please try again.');
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: { text?: string; mode?: string; lang?: string };

  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const text = body.text?.trim() ?? '';
  if (!text) throw error(400, 'text is required');

  const mode = body.mode === 'translate' ? 'translate' : 'improve';
  const lang = pickLang(body.lang, cookies.get('lang'));

  if (mode === 'improve') {
    const improved = await improve(text, lang);
    return json({ ok: true, mode, improved });
  } else {
    const translations = await translateAll(text);
    return json({ ok: true, mode, translations });
  }
};
