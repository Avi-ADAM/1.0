/**
 * POST /api/mission/suggest
 *
 * Given a mission name + description, uses Gemini to extract skills/roles/
 * work-ways/values, an improved description and an estimate of the mission's
 * worth (total hours × value per hour — the two numbers the form's money row
 * asks for), then runs `matchAllCategories` to split the vocabulary into
 * matched / suggestion / new.
 *
 * Also queries the mission library for similar existing catalog entries
 * (so the UI can offer "use existing template" before creating a new one).
 *
 * Copied/adapted from analyze-business/+server.ts.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Agent } from '@mastra/core/agent';
import { createGoogleModel } from '../../../../mastra/lib/createModel';
import { matchAllCategories } from '$lib/embed/matcher.js';
import { sendToSer } from '$lib/send/sendToSer.js';
import {
  buildCategory,
  clampNumber,
  HOURS_RANGE,
  VALPH_RANGE
} from './normalize.js';

// ── Lang helpers ──────────────────────────────────────────────────────────────

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

// ── Gemini extraction ─────────────────────────────────────────────────────────

interface MissionExtraction {
  skills: string[];
  roles: string[];
  workways: string[];
  vallues: string[];
  improvedDescrip: string;
  /** Estimated total hours the mission takes. `null` when the model gave none. */
  nhours: number | null;
  /** Estimated value of one hour of this work. `null` when the model gave none. */
  valph: number | null;
}

async function extractWithGemini(
  name: string,
  descrip: string,
  lang: Lang
): Promise<MissionExtraction> {
  const agent = new Agent({
    id: 'MissionExtractor',
    name: 'MissionExtractor',
    instructions:
      'You extract mission metadata from a name and description. Return JSON only - no explanations, no markdown fences.',
    model: createGoogleModel(undefined, 'gemini-3-flash-preview', { thinkingBudget: 0 })
  });

  const langName = LANG_NAMES[lang];
  const prompt = `Analyze this mission name and description, then return JSON ONLY:
{
  "skills":          [],  // 3-7 specific technical/professional skills needed (atomic, 1-3 words each, in ${langName})
  "roles":           [],  // 1-3 roles/positions that match this mission (in ${langName})
  "workways":        [],  // 1-3 work modes from: remote, onsite, hybrid, full-time, part-time, freelance, shifts (translate to ${langName})
  "vallues":         [],  // 2-4 core values implied by the mission: creativity, innovation, community, impact... (in ${langName})
  "improvedDescrip": "",  // Improved mission description: 2-3 sentences, clear and attractive, in ${langName}. May include simple HTML like <p>. Keep the original meaning.
  "nhours":          0,   // Estimated TOTAL hours this mission takes, as a number
  "valph":           0    // Estimated fair value of ONE hour of this work, as a number (currency units)
}

Rules:
- Output language: ALWAYS ${langName}.
- skills: atomic nouns only (e.g. "React", "video editing", "node.js"). No phrases like "experience in X".
- workways: only real work modes - not skills or roles.
- vallues: short noun phrases (1-2 words). No near-duplicates.
- improvedDescrip: improve clarity and appeal while preserving all facts. If original is good, minimal changes.
- nhours: a realistic total for the whole mission (not per week). Use the description when it states a scope; otherwise estimate from the kind of work. Between ${HOURS_RANGE.min} and ${HOURS_RANGE.max}.
- valph: the going hourly rate for this work in the Israeli market, in shekels (₪), for a competent professional. Between ${VALPH_RANGE.min} and ${VALPH_RANGE.max}. Simple manual work is at the low end, specialised professional work at the high end.
- nhours and valph: plain numbers only - no currency signs, no ranges, no text.
- Return ONLY the JSON object, no other text.

Mission Name: "${name}"
Description: "${descrip || '(no description provided)'}"`;

  const result = await agent.generate([{ role: 'user', content: prompt }]);

  const cleaned = (result.text ?? '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      skills:          Array.isArray(parsed.skills)    ? parsed.skills.slice(0, 7).map((v: any) => String(v).slice(0, 60))  : [],
      roles:           Array.isArray(parsed.roles)     ? parsed.roles.slice(0, 3).map((v: any) => String(v).slice(0, 80))   : [],
      workways:        Array.isArray(parsed.workways)  ? parsed.workways.slice(0, 3).map((v: any) => String(v).slice(0, 60)): [],
      vallues:         Array.isArray(parsed.vallues)   ? parsed.vallues.slice(0, 4).map((v: any) => String(v).slice(0, 40)) : [],
      improvedDescrip: String(parsed.improvedDescrip ?? '').slice(0, 3000),
      nhours:          clampNumber(parsed.nhours, HOURS_RANGE),
      valph:           clampNumber(parsed.valph,  VALPH_RANGE),
    };
  } catch (e) {
    console.error('[mission/suggest] Gemini parse failed:', cleaned.slice(0, 300));
    throw new Error('AI response could not be parsed. Please try again.');
  }
}

// ── Similar missions from library ─────────────────────────────────────────────

interface SimilarMission {
  id: string;
  missionName: string;
  descrip: string;
  skills: string[];
}

async function findSimilarMissions(
  name: string,
  skills: string[],
  fetchFn: typeof fetch
): Promise<SimilarMission[]> {
  // Search by mission name + top skill (max 2 queries to keep it fast)
  const queries = [name, ...(skills.slice(0, 1))].filter(Boolean);
  const byId = new Map<string, SimilarMission>();

  try {
    await Promise.all(
      queries.map(async (q) => {
        const res = await sendToSer({ q }, '200findMissionsBySkill', 0, 0, false, fetchFn);
        for (const node of res?.data?.missions?.data ?? []) {
          const id = String(node.id);
          if (byId.has(id)) continue;
          byId.set(id, {
            id,
            missionName: node.attributes?.missionName ?? '',
            descrip:     node.attributes?.descrip ?? '',
            skills: (node.attributes?.skills?.data ?? [])
              .map((s: any) => s?.attributes?.skillName)
              .filter((s: any): s is string => typeof s === 'string' && s.length > 0),
          });
        }
      })
    );
  } catch (err) {
    console.warn('[mission/suggest] findSimilarMissions failed:', err);
  }

  return [...byId.values()].slice(0, 6);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  let body: { name?: string; descrip?: string; lang?: string };

  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const name = body.name?.trim() ?? '';
  if (!name) throw error(400, 'name is required');

  const descrip = body.descrip?.trim() ?? '';
  const lang    = pickLang(body.lang, cookies.get('lang'));

  // 1. Gemini extraction
  const extraction = await extractWithGemini(name, descrip, lang);

  // 2. Vector match against Pinecone (best-effort - won't throw)
  let matchResults: Awaited<ReturnType<typeof matchAllCategories>> | null = null;
  try {
    matchResults = await matchAllCategories({
      skills:   extraction.skills,
      roles:    extraction.roles,
      methods:  extraction.workways,
      vallues:  extraction.vallues,
    });
  } catch (err) {
    console.warn('[mission/suggest] matchAllCategories unavailable:', err);
  }

  // 3. Find similar missions from library in parallel
  const similarMissions = await findSimilarMissions(name, extraction.skills, fetch);

  // ── Build response ──────────────────────────────────────────────────────────
  // Normalize matchResults into a simple per-category shape for the client
  // (see `buildCategory` - the transposition is the part that has been wrong).
  return json({
    ok: true,
    lang,
    extraction: {
      skills:          extraction.skills,
      roles:           extraction.roles,
      workways:        extraction.workways,
      vallues:         extraction.vallues,
      improvedDescrip: extraction.improvedDescrip,
      nhours:          extraction.nhours,
      valph:           extraction.valph,
    },
    matchResults: {
      skills:   buildCategory('skills',  matchResults, extraction.skills),
      roles:    buildCategory('roles',   matchResults, extraction.roles),
      workways: buildCategory('methods', matchResults, extraction.workways),
      vallues:  buildCategory('vallues', matchResults, extraction.vallues),
    },
    similarMissions,
  });
};
