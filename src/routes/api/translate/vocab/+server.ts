/**
 * `GET /api/translate/vocab?locale=ar` — the shared catalog (skills, roles,
 * work-ways, values) in one reader locale, as `{ source → text }`
 * (PLAN_UGC_TRANSLATION §19).
 *
 * `source` is the English base name, normalised the way the cache hashes it
 * (`normalizeForHash`), so the client can look a chip up by the string it
 * already holds. Only `ar` / `ru` / `es` are served: `he` and `en` have their
 * own Strapi rows, and a cache row must never override a curated one.
 *
 * Read-only and free. It never buys anything — the backfill fills these rows.
 * Off (empty map) unless `TRANSLATE_SURFACES` includes `vocabulary`.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendToSer } from '$lib/send/sendToSer.js';
import { readsCache } from '$lib/server/translation/config.js';
import { MAX_HASHES_PER_READ, readTranslationCache } from '$lib/server/translation/store.js';
import {
    VOCAB_KINDS,
    isVocabCacheLocale,
    vocabPageCount,
    vocabRows,
    vocabStrings
} from '$lib/server/translation/vocab.js';
import { isRealTranslation } from '$lib/translation/hits.js';
import type { TranslatableString } from '$lib/translation/types.js';

/** Catalog pages read per kind, at most. 200 × 10 is far past today's catalog. */
const MAX_PAGES = 10;
const PAGE_SIZE = 200;
/** The catalog changes rarely and the backfill fills it once a day. */
const TTL_MS = 30 * 60 * 1000;

const memo = new Map<string, { at: number; map: Record<string, string> }>();

async function catalogStrings(fetch: typeof globalThis.fetch): Promise<TranslatableString[]> {
    const seen = new Map<string, TranslatableString>();
    for (const kind of VOCAB_KINDS) {
        for (let page = 1; page <= MAX_PAGES; page++) {
            let res: unknown;
            try {
                res = await sendToSer({ page, pageSize: PAGE_SIZE }, kind.qid, 0, 0, true, fetch);
            } catch {
                break;
            }
            for (const s of vocabStrings(kind, vocabRows(kind, res))) {
                if (!seen.has(s.hash)) seen.set(s.hash, s);
            }
            const pages = vocabPageCount(kind, res);
            if (!pages || page >= pages) break;
        }
    }
    return [...seen.values()];
}

export const GET: RequestHandler = async ({ url, fetch, setHeaders }) => {
    const locale = url.searchParams.get('locale');
    if (!isVocabCacheLocale(locale) || !readsCache('vocabulary')) {
        return json({ locale, map: {} });
    }

    const cached = memo.get(locale);
    if (cached && Date.now() - cached.at < TTL_MS) {
        setHeaders({ 'cache-control': 'public, max-age=600' });
        return json({ locale, map: cached.map });
    }

    const strings = await catalogStrings(fetch);
    const map: Record<string, string> = {};
    for (let i = 0; i < strings.length; i += MAX_HASHES_PER_READ) {
        const slice = strings.slice(i, i + MAX_HASHES_PER_READ);
        const { hits } = await readTranslationCache(slice, locale, { fetch, pref: 'always' });
        for (const s of slice) {
            const hit = hits[s.hash];
            if (isRealTranslation(hit)) map[s.source] = hit.text;
        }
    }

    memo.set(locale, { at: Date.now(), map });
    setHeaders({ 'cache-control': 'public, max-age=600' });
    return json({ locale, map });
};
