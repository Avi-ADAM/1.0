/**
 * Concierge extraction agent (PLAN_CONCIERGE §7 — AI Extraction).
 *
 * A Mastra `Agent` that turns a free-form wish (longDes) into a structured
 * breakdown: missions, resources, the *skills* those missions imply, a guess
 * at categories, a title suggestion, and gentle clarifying hints.
 *
 * The skills are the bridge to DB enrichment (see `enrichWish.ts`): once we
 * know which skills a wish needs, we can look up existing missions and real
 * people on the platform who can answer it.
 *
 * Model selection mirrors the other agents in `src/mastra/agents/*`:
 * Google Gemini Flash-Lite first, Groq as a fallback. Output is requested as
 * raw JSON and parsed by the caller (same proven pattern as `intent-agent`).
 */

import { Agent } from '@mastra/core/agent';
import {
  createGoogleModel,
  createGroqModel,
  hasGoogleModelConfig,
  hasGroqModelConfig
} from '../../../mastra/lib/createModel';

const SYSTEM_PROMPT = `You are Lev, a gentle AI concierge for the Hebrew community platform 1Lev1.
Your job: read a user's wish/request and break it into a structured, actionable spec.

Return ONLY valid JSON - no markdown, no code fences, no commentary.
Start with { and end with }. Exact shape:
{
  "missions":   [{"name": "...", "imp": "must" | "nice"}],
  "resources":  [{"name": "...", "imp": "must" | "nice"}],
  "skills":     [{"name": "..."}],
  "categories": ["..."],
  "titleSuggestion": "...",
  "hints":      [{"kind": "question" | "suggestion", "text": "..."}],
  "details": {
    "dateFrom": "YYYY-MM-DD" | "",
    "dateTo":   "YYYY-MM-DD" | "",
    "budget":   number | null,
    "currency": "ILS" | "USD" | "EUR" | ... | "",
    "place":    "..." | "",
    "online":   true | false | null,
    "groupKind": "group_purchase" | "group_trip" | "community_event" | "public_renovation" | "recurring_subscription" | ""
  }
}

Field rules:
- missions    = concrete tasks/services the wish needs done (max 5, 2-4 words each).
- resources   = physical items, places, materials or conditions needed (max 4).
- skills      = the human skills/professions a person would need to fulfil the
                missions (e.g. "צלם", "נהג", "מטפל ספא", "מתכנת", "מאפרת"). Max 6,
                single words or short noun phrases. These are used to search for
                real people on the platform, so prefer canonical profession nouns.
- categories  = 1-3 broad domain labels for the wish (e.g. "אירועים", "בריאות",
                "הסעות", "טכנולוגיה").
- titleSuggestion = a short, warm 3-7 word title for the wish.
- hints       = 1-3 gentle clarifying questions or suggestions to sharpen the wish.
- details     = ONLY facts the writer actually stated. Never guess; leave a
                field empty ("" / null) when the text does not say it.
  - dateFrom / dateTo: when it should happen. Resolve relative dates ("next
    Friday", "end of October", "בעוד שבועיים") against the "Today" line you are
    given. A single day → both the same. A month or a period → its first and
    last day. A past date as written means the next occurrence.
  - budget: the amount the writer is willing to spend, as a plain number (no
    separators). "up to 3000" → 3000. A range → its upper end.
  - currency: ISO 4217 code of that amount ("ש\\"ח"/"שקל" → ILS, "$"/"dollars"
    → USD, "€" → EUR). "" when no amount or no currency is written.
  - place: the city / address / area where it happens, as a geocodable name
    ("Haifa", "רחוב הרצל 5, תל אביב"). "" when not stated.
  - online: true when it is explicitly remote/online/by zoom, false when a
    physical place is required, null when not stated.
  - groupKind: only when the writer describes something OTHERS join —
    buying together, a shared trip, a community event, fixing a public space,
    a recurring shared subscription. Otherwise "".

General rules:
- ALWAYS answer in the SAME language as the input.
- Mark "must" only when essential; otherwise "nice".
- Be specific to THIS wish - never generic filler.
- If the text is shorter than 20 chars or unintelligible, return every array
  empty and titleSuggestion as "".`;

/**
 * Build the concierge extraction agent. Cached per-process so we don't rebuild
 * the model client on every keystroke-debounced request.
 */
let cached: Agent | null = null;

export function getConciergeAgent(apiKey?: string): Agent {
  if (cached) return cached;

  const model = (() => {
    if (hasGoogleModelConfig(apiKey)) {
      try {
        return createGoogleModel(apiKey, 'gemini-flash-lite-latest');
      } catch (e) {
        console.warn('[conciergeAgent] Google model failed, trying Groq…', e);
      }
    }
    if (hasGroqModelConfig()) {
      return createGroqModel();
    }
    throw new Error(
      'No AI model provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.'
    );
  })();

  cached = new Agent({
    id: 'ConciergeExtractAgent',
    name: 'ConciergeExtractAgent',
    instructions: SYSTEM_PROMPT,
    model
  });

  return cached;
}
