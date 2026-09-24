/**
 * rephraseWish — "Lev's phrasing suggestion" in the Concierge composer.
 *
 * Takes the wish body as plain paragraphs and returns a clearer version of the
 * same wish, in the same language. Plain text in, plain text out: the composer
 * turns the paragraphs back into <p> blocks itself, so the model can never
 * inject markup into the editor.
 *
 * Same model ladder as the extraction agent: Gemini Flash-Lite (free tier)
 * first, Groq as a fallback.
 */

import { Agent } from '@mastra/core/agent';
import {
  createGoogleModel,
  createGroqModel,
  hasGoogleModelConfig,
  hasGroqModelConfig
} from '../../../mastra/lib/createModel';

const SYSTEM_PROMPT = `You help people on the community platform 1Lev1 phrase a wish -
a request for help, a service or something made to order - so that the
members who read it understand exactly what is needed.

Rewrite the text you are given:
- Keep the SAME language as the input. Never translate.
- Keep every fact, number, date, place and constraint. Never invent new ones.
- Make it clear and warm, first person, well ordered: what is needed, for whom,
  when and where, and what matters most.
- Keep roughly the same length; never more than twice as long.
- Separate paragraphs with a blank line. No headings, no bullets, no markdown,
  no quotes around the answer, no commentary - return ONLY the rewritten text.`;

let cached: Agent | null = null;

function getAgent(apiKey?: string): Agent {
  if (cached) return cached;

  const model = (() => {
    if (hasGoogleModelConfig(apiKey)) {
      try {
        return createGoogleModel(apiKey, 'gemini-flash-lite-latest');
      } catch (e) {
        console.warn('[rephraseWish] Google model failed, trying Groq…', e);
      }
    }
    if (hasGroqModelConfig()) return createGroqModel();
    throw new Error('No AI model provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.');
  })();

  cached = new Agent({
    id: 'ConciergeRephraseAgent',
    name: 'ConciergeRephraseAgent',
    instructions: SYSTEM_PROMPT,
    model
  });
  return cached;
}

/** Longest wish body we send to the model, in characters. */
export const REPHRASE_MAX_INPUT = 4000;

/** Strip the fences / wrapping quotes a model sometimes adds anyway. */
export function cleanRephrase(raw: string): string {
  let s = (raw ?? '').trim();
  s = s.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();
  if (/^["“”«].*["“”»]$/s.test(s)) s = s.slice(1, -1).trim();
  return s.replace(/\n{3,}/g, '\n\n');
}

export async function rephraseWish(
  title: string,
  text: string,
  apiKey?: string
): Promise<string> {
  const body = (text ?? '').trim().slice(0, REPHRASE_MAX_INPUT);
  if (body.length < 10) return '';

  const head = (title ?? '').trim().slice(0, 120);
  const result = await getAgent(apiKey).generate([
    {
      role: 'user',
      content: (head ? `Title: ${head}\n\n` : '') + `Wish text:\n${body}`
    }
  ]);
  return cleanRephrase(result?.text ?? '');
}
