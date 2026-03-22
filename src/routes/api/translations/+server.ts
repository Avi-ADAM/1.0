/**
 * SvelteKit API Route - Auto Localization for Strapi 4
 * POST /api/auto-localize/strapi4
 *
 * Body: {
 *   contentType: string       // e.g. "skills"
 *   entryId: number           // Strapi entry ID
 *   sourceLocale: string      // e.g. "he"
 * }
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STRAPI_TOKEN, GROQ_API_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';

// ─── CONFIG ────────────────────────────────────────────────────────────────────

const STRAPI_URL = import.meta.env.VITE_URL ?? 'http://localhost:1337';
const GROQ_MODEL = env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

// ─── HELPERS ───────────────────────────────────────────────────────────────────

/** Strapi 4 authenticated fetch */
async function strapiFetch(path: string, options: RequestInit = {}) {
  console.log(`[StrapiFetch] Requesting: ${path}`);
  const res = await fetch(`${STRAPI_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[StrapiFetch] Error [${res.status}] ${path}: ${text}`);
    throw new Error(`Strapi 4 error [${res.status}] ${path}: ${text}`);
  }

  return res.json();
}

/** Fetch the entry in the source locale (Strapi 4 uses ?locale=xx) */
async function getEntry(contentType: string, id: number, locale: string) {
  const data = await strapiFetch(`/api/${contentType}/${id}?locale=${locale}&populate=*`);
  return data.data; // { id, attributes: { ... } }
}

/** Fetch all available locales from Strapi 4 */
async function getLocales(): Promise<{ code: string; name: string }[]> {
  const data = await strapiFetch('/api/i18n/locales');
  return data; // array of { id, name, code, isDefault }
}

/** Translate arbitrary text using Groq */
async function translateWithGroq(
  text: string,
  targetLocale: string,
  targetLanguageName: string
): Promise<string> {
  console.log(`[Groq] Translating: ${text}`);
  console.log(`[Groq] Target locale: ${targetLocale}`);
  console.log(`[Groq] Target language name: ${targetLanguageName}`);
  console.log(`[Groq] API Key: ${GROQ_API_KEY}`);
  console.log(`[Groq] Model: ${GROQ_MODEL}`);
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. 
Translate the user's text accurately into ${targetLanguageName} (locale: ${targetLocale}).
Return ONLY the translated text with no extra commentary or formatting.`,
        },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[Groq] Error [${res.status}]: ${err}`);
    throw new Error(`Groq error [${res.status}]: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

/**
 * Translate all translatable string fields in an attributes object.
 * Fields to skip: createdAt, updatedAt, publishedAt, locale, slug, etc.
 */
const SKIP_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'publishedAt',
  'locale',
  'slug',
  'localizations',
]);

async function translateAttributes(
  attributes: Record<string, unknown>,
  targetLocale: string,
  targetLanguageName: string
): Promise<Record<string, unknown>> {
  const translated: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (SKIP_FIELDS.has(key)) continue;

    if (typeof value === 'string' && value.trim().length > 0) {
      translated[key] = await translateWithGroq(value, targetLocale, targetLanguageName);
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === 'object' &&
      value[0] !== null &&
      'type' in value[0]
    ) {
      // Likely Strapi rich-text blocks - translate text nodes inside
      translated[key] = await translateBlocks(value as RichTextBlock[], targetLocale, targetLanguageName);
    } else {
      // Preserve non-string values (numbers, booleans, relations, media)
      translated[key] = value;
    }
  }

  return translated;
}

interface RichTextBlock {
  type: string;
  children?: RichTextBlock[];
  text?: string;
  [key: string]: unknown;
}

async function translateBlocks(
  blocks: RichTextBlock[],
  targetLocale: string,
  targetLanguageName: string
): Promise<RichTextBlock[]> {
  return Promise.all(
    blocks.map(async (block) => {
      if (block.text && typeof block.text === 'string' && block.text.trim()) {
        return { ...block, text: await translateWithGroq(block.text, targetLocale, targetLanguageName) };
      }
      if (block.children) {
        return {
          ...block,
          children: await translateBlocks(block.children, targetLocale, targetLanguageName),
        };
      }
      return block;
    })
  );
}

/**
 * Create a localization for an existing Strapi 4 entry.
 * Strapi 4 endpoint: POST /api/{contentType}/{id}/localizations
 */
async function createLocalization(
  contentType: string,
  id: number,
  locale: string,
  attributes: Record<string, unknown>
) {
  return strapiFetch(`/api/${contentType}/${id}/localizations`, {
    method: 'POST',
    body: JSON.stringify({ locale, ...attributes }),
  });
}

/** Update an existing Strapi 4 entry */
async function updateEntry(contentType: string, id: number, attributes: Record<string, unknown>) {
  console.log(`[Strapi] Updating entry: ${contentType}/${id}`);
  return strapiFetch(`/api/${contentType}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ data: attributes }),
  });
}

/** Check if text contains Hebrew characters */
function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

// ─── ROUTE HANDLER ─────────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request }) => {
  let body: { contentType: string; entryId: number; sourceLocale: string };

  try {
    body = await request.json();
    console.log('[Translations API] Received request:', body);
  } catch {
    console.error('[Translations API] Failed to parse JSON body');
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { contentType, entryId, sourceLocale } = body;

  if (!contentType || !entryId || !sourceLocale) {
    console.error('[Translations API] Missing required fields', { contentType, entryId, sourceLocale });
    return json(
      { error: 'Missing required fields: contentType, entryId, sourceLocale' },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch all available locales
    console.log('[Translations API] Fetching locales...');
    const allLocales = await getLocales();

    // 2. Fetch the source entry
    console.log(`[Translations API] Fetching source entry: ${contentType}/${entryId} (locale: ${sourceLocale})`);
    const sourceEntry = await getEntry(contentType, entryId, sourceLocale);

    if (!sourceEntry || !sourceEntry.attributes) {
      console.error('[Translations API] Source entry not found or missing attributes');
      throw new Error('Source entry not found or missing attributes');
    }

    const sourceAttributes: Record<string, unknown> = sourceEntry.attributes;

    // --- Detect if this is actually Hebrew content in a non-Hebrew locale ---
    const containsHebrew = Object.values(sourceAttributes).some(
      (v) => typeof v === 'string' && isHebrew(v)
    );

    let actualSourceLocale = sourceLocale;
    let isMismatch = false;

    if (sourceLocale !== 'he' && containsHebrew) {
      console.log(`[Translations API] MISMATCH: Detected Hebrew text in '${sourceLocale}' locale.`);
      actualSourceLocale = 'he';
      isMismatch = true;

      // Ensure 'he' localization exists with the Hebrew text
      try {
        await createLocalization(contentType, entryId, 'he', sourceAttributes);
        console.log('[Translations API] Created Hebrew localization as original source.');
      } catch (e) {
        console.warn('[Translations API] Hebrew localization might already exist or failed:', e);
      }
    }

    // Target locales are all except the actual source (usually 'he' in mistyped cases)
    const targetLocales = allLocales.filter((l) => l.code !== actualSourceLocale);
    console.log(`[Translations API] Target locales for translation:`, targetLocales.map(l => l.code));

    if (targetLocales.length === 0) {
      return json({ message: 'No other locales found. Nothing to translate.' });
    }

    // 3. Translate & process each target localization
    const results: { locale: string; status: string; error?: string }[] = [];

    for (const targetLocale of targetLocales) {
      console.log(`[Translations API] Processing locale: ${targetLocale.code} (${targetLocale.name})`);
      try {
        const translatedAttributes = await translateAttributes(
          sourceAttributes,
          targetLocale.code,
          targetLocale.name
        );
        console.log(`[Translations API] Translation complete for ${targetLocale.code}`);

        if (isMismatch && targetLocale.code === sourceLocale) {
          // If we had a mismatch, we need to UPDATE the original entry (which has the wrong language)
          console.log(`[Translations API] Updating original ${sourceLocale} entry with translated text...`);
          await updateEntry(contentType, entryId, translatedAttributes);
          results.push({ locale: targetLocale.code, status: 'updated' });
        } else {
          // Normal case: create a new localization
          console.log(`[Translations API] Creating localization for ${targetLocale.code}...`);
          await createLocalization(contentType, entryId, targetLocale.code, translatedAttributes);
          results.push({ locale: targetLocale.code, status: 'created' });
        }
      } catch (err) {
        console.error(`[Translations API] Error for locale ${targetLocale.code}:`, err);
        results.push({
          locale: targetLocale.code,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    console.log('[Translations API] Final results:', results);
    return json({
      entryId,
      contentType,
      sourceLocale,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Translations API] Global error:', message, err);
    return json({ error: message }, { status: 500 });
  }
};
