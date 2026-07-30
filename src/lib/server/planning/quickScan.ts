/**
 * Tier 1 — the thin quick scan (PLAN_PROJECT_PLANNING_BOARDS §1).
 *
 * Answers one question cheaply: *given what this project actually looks like
 * right now, what are a few directions worth pursuing?* It returns 3–5
 * one-or-two-sentence directions and *nothing else* — no missions, no
 * resources, no breakdown. Expanding a direction into concrete rows is tier 2
 * (`expandDirection.ts`) and only happens when the user asks for it.
 *
 * Never runs automatically. It is invoked by an explicit user action.
 *
 * Cost profile: one short call to a flash-lite model over a context snapshot
 * that was already built for the chat — no extra queries, no vector search.
 */

import { Agent } from '@mastra/core/agent';
import {
  createGoogleModel,
  createGroqModel,
  hasGoogleModelConfig,
  hasGroqModelConfig
} from '../../../mastra/lib/createModel';
import { coerceJson } from '../ai/extractWish.js';
import {
  LANGUAGE_RULE,
  RIKMA_PRIMER,
  UNTRUSTED_DATA_RULE,
  stageGuidance
} from './domain.js';
import {
  buildPlanningSnapshot,
  renderPlanningSnapshot,
  type PlanningSnapshot
} from './planningContext.js';
import type { ProjectStage, ScanSignals } from './signals.js';

export interface ScannedDirection {
  title: string;
  descrip: string;
  rationale: string;
}

export interface QuickScanResult {
  stage: ProjectStage;
  signals: ScanSignals;
  directions: ScannedDirection[];
  /** The rikma's website was read for this scan (see `siteContext.ts`). */
  siteUsed: string | null;
}

const SYSTEM_PROMPT = [
  `You are a planning advisor for a rikma on the 1Lev1 collaboration platform.

You will receive a snapshot of ONE rikma's real current state. Propose a few
DIRECTIONS for advancing it — strategic angles, not task lists.`,
  '',
  RIKMA_PRIMER,
  '',
  `## Output

Return ONLY valid JSON — no markdown, no code fences, no commentary.
Start with { and end with }. Exact shape:
{ "directions": [ { "title": "...", "descrip": "...", "rationale": "..." } ] }

Rules:
- 3 to 5 directions. Fewer is fine; never more than 5.
- title      = 2-5 words naming the direction.
- descrip    = ONE sentence on what pursuing it would mean.
- rationale  = ONE sentence citing the SPECIFIC observation about THIS rikma
               that motivates it (e.g. "4 missions are published but untaken",
               or something the rikma's own website says it does).
               Never invent facts that are not in the snapshot.
- Do NOT list individual missions, chores, resources or products — breaking a
  direction down is a separate, later step the member triggers deliberately.
  Stay at the level of "let's advance it this way".
- Directions must differ from each other. Three angles that are one angle
  reworded is a bad answer.
- Say nothing about how the platform works; the members know. Talk about
  THEIR rikma.`,
  '',
  UNTRUSTED_DATA_RULE,
  '',
  LANGUAGE_RULE
].join('\n');

let cachedAgent: Agent | null = null;

function getScanAgent(apiKey?: string): Agent {
  if (cachedAgent) return cachedAgent;

  const model = (() => {
    if (hasGoogleModelConfig(apiKey)) {
      try {
        return createGoogleModel(apiKey, 'gemini-flash-lite-latest');
      } catch (e) {
        console.warn('[quickScan] Google model failed, trying Groq…', e);
      }
    }
    if (hasGroqModelConfig()) return createGroqModel();
    throw new Error('No AI model provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.');
  })();

  cachedAgent = new Agent({
    id: 'ProjectQuickScanAgent',
    name: 'ProjectQuickScanAgent',
    instructions: SYSTEM_PROMPT,
    model
  });
  return cachedAgent;
}

/** Trim + clamp one model-produced direction; returns null when unusable. */
function normDirection(raw: unknown): ScannedDirection | null {
  const o = (raw ?? {}) as Record<string, unknown>;
  const title = String(o.title ?? '').trim();
  if (!title) return null;
  return {
    title: title.slice(0, 120),
    descrip: String(o.descrip ?? '').trim().slice(0, 400),
    rationale: String(o.rationale ?? '').trim().slice(0, 400)
  };
}

/**
 * Parse the model's reply into at most 5 directions. Exported for testing —
 * models misbehave, and this is where that is absorbed.
 */
export function parseDirections(rawText: string): ScannedDirection[] {
  const parsed = coerceJson(rawText ?? '') as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== 'object') return [];

  // Accept both {directions:[…]} and a bare array, since models drift.
  const list = Array.isArray(parsed) ? parsed : parsed.directions;
  if (!Array.isArray(list)) return [];

  const out: ScannedDirection[] = [];
  const seen = new Set<string>();
  for (const entry of list) {
    const d = normDirection(entry);
    if (!d) continue;
    const key = d.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
    if (out.length >= 5) break;
  }
  return out;
}

/** Build the grounding message: neutral signals + the delimited snapshot. */
export function buildScanPrompt(snapshot: PlanningSnapshot, lang: string): string {
  return [
    renderPlanningSnapshot(snapshot, lang),
    '',
    stageGuidance(snapshot.signals.stage)
  ].join('\n');
}

/**
 * Run the thin scan for a project.
 *
 * @param projectId  project to scan
 * @param userId     the member asking (scopes the context snapshot)
 * @param fetchInstance request-bound fetch
 * @param options.siteMode  whether the rikma's website may be read for extra
 *   context. `'auto'` (the default) reads it only when the rikma's own
 *   description is too thin to advise on.
 */
export async function scanProjectDirections(
  projectId: string,
  userId: string,
  fetchInstance: typeof fetch,
  options: {
    apiKey?: string;
    lang?: string;
    isServerRequest?: boolean;
    siteMode?: 'auto' | 'always' | 'never';
  } = {}
): Promise<QuickScanResult> {
  const lang = options.lang ?? 'he';

  const snapshot = await buildPlanningSnapshot(
    String(projectId),
    String(userId),
    fetchInstance,
    {
      isServerRequest: options.isServerRequest ?? false,
      siteMode: options.siteMode ?? 'auto'
    }
  );

  let directions: ScannedDirection[] = [];
  try {
    const agent = getScanAgent(options.apiKey);
    const result = await agent.generate([
      { role: 'user', content: buildScanPrompt(snapshot, lang) }
    ]);
    directions = parseDirections(result?.text ?? '');
  } catch (err) {
    // A failed scan must not break the page — the user simply sees no
    // suggestions and can write their own direction or retry.
    console.error('[quickScan] direction generation failed:', err);
  }

  return {
    stage: snapshot.signals.stage,
    signals: snapshot.signals,
    directions,
    siteUsed: snapshot.site?.ok ? snapshot.site.url : null
  };
}
