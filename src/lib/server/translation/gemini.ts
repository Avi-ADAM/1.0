/**
 * The translation engine adapter (§5.1–5.2 of docs/PLAN_UGC_TRANSLATION.md).
 *
 * **One request fills all five locales.** The free tier's binding constraint is
 * requests per minute and per day, not tokens, so translating N strings into
 * every target at once costs ~5× the output tokens and saves 5× the scarce
 * resource. This holds on the on-demand path too: when a Spanish reader
 * triggers a miss we buy Arabic, Russian, English and Hebrew in the same
 * breath, because the request has already been spent.
 *
 * A direct `fetch`, in the shape `gemini-embeddings.ts` already proved here,
 * rather than the AI SDK (§14.5). The whole engine is reached through one
 * narrow function — `translateBatch(items, targets) → results` — so a second
 * free-quota provider is a new file implementing `TranslateEngine`, not a
 * refactor of everything above it.
 *
 * What this file is *not* allowed to do: decide whether a request may be spent
 * (that is `governor.ts`), or decide whether an answer may be stored (that is
 * `validate.ts`). It asks, it parses, it hands back. Nothing here writes.
 */

import { glossaryFor } from '$lib/translation/glossary.js';
import { validateBatchShape, type EngineItem } from './validate.js';
import type { Locale, TranslationMode } from '$lib/translation/types.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface TranslateItem {
    /** The source hash. Correlates the answer back to the string; never a key. */
    id: string;
    mode: TranslationMode;
    text: string;
}

export interface TranslateResult extends EngineItem {}

/** The one interface a second engine has to satisfy (§14.5). */
export interface TranslateEngine {
    (items: TranslateItem[], targets: Locale[]): Promise<TranslateResult[]>;
}

export interface GeminiOptions {
    apiKey: string;
    model: string;
    /** Injected in tests. Defaults to global fetch. */
    transport?: typeof globalThis.fetch;
    /** Overall deadline for the call. The read path never waits on this. */
    timeoutMs?: number;
}

export class TranslateEngineError extends Error {
    readonly status?: number;
    /** True for 429/5xx — the caller may back off. The quota is already spent. */
    readonly retryable: boolean;

    constructor(message: string, opts: { status?: number; retryable?: boolean } = {}) {
        super(message);
        this.name = 'TranslateEngineError';
        this.status = opts.status;
        this.retryable = opts.retryable ?? false;
    }
}

/**
 * The response schema. The model is given no room to free-form: without this
 * it wraps JSON in prose or in a fenced block roughly one call in twenty, and
 * every one of those is a whole batch thrown away.
 */
function responseSchema(targets: Locale[]) {
    return {
        type: 'OBJECT',
        properties: {
            items: {
                type: 'ARRAY',
                items: {
                    type: 'OBJECT',
                    properties: {
                        id: { type: 'STRING' },
                        detected: { type: 'STRING' },
                        out: {
                            type: 'OBJECT',
                            properties: Object.fromEntries(
                                targets.map((l) => [l, { type: 'STRING' }])
                            ),
                            required: targets
                        }
                    },
                    required: ['id', 'detected', 'out']
                }
            }
        },
        required: ['items']
    };
}

const LANG_NAMES: Record<Locale, string> = {
    he: 'Hebrew',
    en: 'English',
    ar: 'Arabic',
    ru: 'Russian',
    es: 'Spanish'
};

/**
 * The instruction. Every line of it earns its place by preventing a specific
 * failure this repo has seen or the validator would otherwise catch and bin.
 */
export function buildPrompt(items: TranslateItem[], targets: Locale[]): string {
    const glossary = new Map<string, string[]>();
    for (const item of items) {
        for (const target of targets) {
            for (const { from, to } of glossaryFor(item.text, target)) {
                const line = `  ${from} → ${LANG_NAMES[target]}: ${to}`;
                const key = from;
                const acc = glossary.get(key) ?? [];
                if (!acc.includes(line)) acc.push(line);
                glossary.set(key, acc);
            }
        }
    }

    const glossaryBlock = glossary.size
        ? `\nGLOSSARY — these renderings are mandatory. An output that drops one is discarded:\n${[
              ...glossary.values()
          ]
              .flat()
              .join('\n')}\n`
        : '';

    const hasNames = items.some((i) => i.mode === 'transliterate');
    const modeBlock = hasNames
        ? `\nItems marked mode="transliterate" are NAMES (a person, a city, a brand). Render them ` +
          `in the target's script so a reader can pronounce them. Never translate their meaning: ` +
          `a name that means "blessed" stays the name, it does not become the word.\n`
        : '';

    return [
        `You are translating user-written text from a partnership platform into ${targets
            .map((l) => LANG_NAMES[l])
            .join(', ')}.`,
        '',
        'Rules:',
        '- Return every requested language for every item.',
        '- Detect each item\'s source language and report it in "detected" as one of: he, en, ar, ru, es.',
        '- When an item is already in a target language, repeat it unchanged for that language.',
        '- Translate only. Do not explain, apologise, comment, or offer alternatives.',
        '- Plain text only. No HTML, no markdown, no quotes around the result.',
        '- Preserve numbers, currency amounts, URLs and email addresses exactly.',
        '- Keep the register of the original: a one-line mission title stays one line.',
        glossaryBlock,
        modeBlock,
        'ITEMS:',
        JSON.stringify(
            items.map((i) => ({ id: i.id, mode: i.mode, text: i.text })),
            null,
            0
        )
    ]
        .filter(Boolean)
        .join('\n');
}

/**
 * Translate a batch into every target, in one request.
 *
 * Throws `TranslateEngineError` on a transport or shape failure — the caller
 * (the warm endpoint, the backfill worker) turns that into "render source",
 * never into an error a reader can see. The request is counted as spent by the
 * governor *before* this is called, because a request that fails still cost
 * the quota.
 */
export function geminiEngine(opts: GeminiOptions): TranslateEngine {
    const { apiKey, model, transport, timeoutMs = 30_000 } = opts;

    return async function translateBatch(items, targets) {
        if (items.length === 0 || targets.length === 0) return [];
        if (!apiKey) throw new TranslateEngineError('no API key configured');

        const fetchToUse = transport ?? globalThis.fetch;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        let res: Response;
        try {
            res = await fetchToUse(
                `${BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: buildPrompt(items, targets) }] }],
                        generationConfig: {
                            responseMimeType: 'application/json',
                            responseSchema: responseSchema(targets),
                            // Translation is not a creative task. Low temperature
                            // also makes the same source hash the same output on
                            // a re-run, which is what makes a cache honest.
                            temperature: 0.2
                        }
                    })
                }
            );
        } catch (err) {
            throw new TranslateEngineError(
                err instanceof Error ? err.message : String(err),
                { retryable: true }
            );
        } finally {
            clearTimeout(timer);
        }

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new TranslateEngineError(
                `HTTP ${res.status}: ${body.slice(0, 300)}`,
                { status: res.status, retryable: res.status === 429 || res.status >= 500 }
            );
        }

        let payload: unknown;
        try {
            payload = await res.json();
        } catch {
            throw new TranslateEngineError('response was not JSON');
        }

        const text = (payload as any)?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text !== 'string') {
            throw new TranslateEngineError('response carried no text part');
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            throw new TranslateEngineError('model text part was not valid JSON');
        }

        const shape = validateBatchShape(
            parsed,
            items.map((i) => i.id)
        );
        if (!shape.ok) throw new TranslateEngineError(`bad batch shape — ${shape.error}`);

        return shape.items;
    };
}

/**
 * Pack strings into batches of at most `size`, the way `TRANSLATE_BATCH` means
 * it: requests are the scarce resource, so a batch is filled before a second
 * one is opened.
 */
export function chunk<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += Math.max(1, size)) {
        out.push(items.slice(i, i + Math.max(1, size)));
    }
    return out;
}
