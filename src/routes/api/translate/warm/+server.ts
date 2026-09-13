/**
 * `POST /api/translate/warm` — fill cache misses for a reader who is on the
 * page right now (§4.1, §5 of docs/PLAN_UGC_TRANSLATION.md).
 *
 * The read path never waits on this. A loader renders the author's own words
 * and hands the client its miss list; the client posts the list here,
 * fire-and-forget, and the component swaps translations in if this resolves
 * while the reader is still looking. On the next navigation they are cache hits.
 *
 * Four gates, in this order, and every one of them fails *soft* — a refusal is
 * a page that renders source text, which is exactly what the reader saw a
 * moment ago. Nobody sees an error:
 *
 *   1. `TRANSLATE_WRITE` — off by default. The whole endpoint is inert.
 *   2. the per-caller limiter — one client cannot be the reason the day's
 *      budget is gone. This one answers 429, because it *is* the caller's
 *      doing and Retry-After is the honest reply.
 *   3. the governor — the day's on-demand slice, which backfill cannot eat.
 *   4. the validator, inside `cacheTranslations` — a bad answer is not stored.
 *
 * On the text this accepts: the cache is content-addressed, so the client has
 * to send the string, not just its hash — nothing could resolve a hash back to
 * text. A hostile caller can therefore submit text nobody wrote. What that
 * buys them is a translation of their own sentence, stored under its own hash,
 * which no page will ever look up; the real cost is quota, and quota is what
 * gates 2 and 3 exist to bound. See §13 of the plan.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isWorthTranslating, normalizeForHash, hashSource } from '$lib/translation/normalize.js';
import { flatFields } from '$lib/translation/fields.js';
import { limits, warmLimits, writeEnabled, apiKey, stateDir } from '$lib/server/translation/config.js';
import { serverGovernor } from '$lib/server/translation/governor.js';
import { fileGovernorStore } from '$lib/server/translation/governorStore.js';
import { geminiEngine, TranslateEngineError } from '$lib/server/translation/gemini.js';
import { fillTranslations, type FillInput } from '$lib/server/translation/fill.js';
import { warmLimiter, callerKey } from '$lib/server/translation/rateLimit.js';
import type { Locale, TranslationMode } from '$lib/translation/types.js';

const LOCALES: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];
const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/**
 * The longest string the manifest allows anywhere. The endpoint does not know
 * which field a string came from, so it enforces the loosest bound the manifest
 * itself sets rather than inventing a number of its own.
 */
const MAX_LEN = Math.max(...flatFields().map((f) => f.max));

export const POST: RequestHandler = async ({ request, fetch, locals, getClientAddress }) => {
    const userId = (locals as { uid?: string })?.uid || undefined;

    let body: { items?: unknown; locale?: unknown };
    try {
        body = await request.json();
    } catch {
        return json({ filled: 0, reason: 'bad-request' }, { status: 400 });
    }

    if (!writeEnabled()) {
        // Not an error: this is the default state of the feature, and the
        // reader is looking at perfectly good source text.
        return json({ filled: 0, hits: {}, reason: 'disabled' });
    }

    const rules = warmLimits(!!userId);
    const verdict = warmLimiter.take(
        callerKey(userId, getClientAddress()),
        rules.perWindow,
        rules.windowMs
    );
    if (!verdict.ok) {
        return json(
            { filled: 0, hits: {}, reason: 'rate-limited' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil(verdict.retryAfterMs / 1000)) } }
        );
    }

    const locale = isLocale(body.locale) ? body.locale : undefined;
    const inputs = collectInputs(body.items, rules.maxItems);
    if (inputs.length === 0) return json({ filled: 0, hits: {}, reason: 'nothing-to-do' });

    // One request per call — the batch is sized so it stays one. Counted
    // before it is sent, because a request that fails still spent the quota.
    const governor = serverGovernor(limits(), fileGovernorStore(stateDir()));
    const decision = governor.spend('onDemand', 1);
    if (!decision.ok) {
        return json({ filled: 0, hits: {}, reason: `budget:${decision.reason}` });
    }

    const cfg = limits();
    const engine = geminiEngine({ apiKey: apiKey(), model: cfg.model });

    let filled;
    try {
        filled = await fillTranslations(inputs.slice(0, cfg.batch), {
            engine,
            targets: LOCALES,
            forLocale: locale,
            model: cfg.model,
            // A reader asked for this one and got source text while it was
            // fetched — the only demand signal the backfill queue has (§8.2).
            hits: 1
        });
    } catch (err) {
        const retryable = err instanceof TranslateEngineError && err.retryable;
        console.warn(
            `[translation] warm failed (${retryable ? 'retryable' : 'permanent'}):`,
            err instanceof Error ? err.message : err
        );
        return json({ filled: 0, hits: {}, reason: 'engine' });
    }

    if (filled.rows.length === 0) return json({ filled: 0, hits: {}, reason: 'nothing-usable' });

    // Writes go through the Action System, with `isSer:true` — handleFetch
    // injects the internal secret on this same-origin server-side fetch, which
    // is what lets `cacheTranslations` run as the service principal. The same
    // shape /api/cron/maagad already uses.
    try {
        const res = await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                actionKey: 'cacheTranslations',
                params: { rows: filled.rows, userId: userId || 'system' },
                isSer: true
            })
        });
        const stored = await res.json().catch(() => null);
        if (!res.ok || stored?.success === false) {
            console.warn('[translation] cacheTranslations refused:', stored?.error?.message);
        }
    } catch (err) {
        // The reader still gets their translations below; only the *cache* was
        // not filled, so the next reader pays for the same request again.
        // Worth a log line, never worth an error page.
        console.warn('[translation] cache write failed:', err instanceof Error ? err.message : err);
    }

    return json({ filled: filled.rows.length, hits: filled.hits, unfilled: filled.unfilled });
};

/**
 * Coerce the posted list into fill inputs.
 *
 * Applies the same cheap pre-filter the collector does, because the strings
 * arrive from a client and a URL or a bare number is not worth a row whatever
 * the client believes.
 */
function collectInputs(raw: unknown, max: number): FillInput[] {
    if (!Array.isArray(raw)) return [];

    const seen = new Set<string>();
    const out: FillInput[] = [];

    for (const item of raw) {
        if (out.length >= max) break;

        const text = typeof item === 'string' ? item : (item as { text?: unknown })?.text;
        if (typeof text !== 'string') continue;

        const source = normalizeForHash(text);
        if (!source || source.length > MAX_LEN) continue;
        if (!isWorthTranslating(source)) continue;

        const hash = hashSource(source);
        if (seen.has(hash)) continue;
        seen.add(hash);

        const rawMode = (item as { mode?: unknown })?.mode;
        const mode: TranslationMode = rawMode === 'transliterate' ? 'transliterate' : 'translate';

        out.push({ source, mode, firstSeenOn: firstSeenOf(item) });
    }

    return out;
}

/** `openMission.descrip` — telemetry only, and never trusted into a key. */
function firstSeenOf(item: unknown): string | undefined {
    const raw = (item as { path?: unknown })?.path;
    return typeof raw === 'string' && /^[a-zA-Z]+\.[a-zA-Z]+$/.test(raw) ? raw : undefined;
}
