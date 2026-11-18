/**
 * A member's name in the reader's script — PLAN_UGC_TRANSLATION §18.
 *
 * A name is the one string on the site whose correct rendering is a fact only
 * its owner knows: `בבאיוף` is Babayof to one family and Babayov to another.
 * So the member's own spelling for a script always wins, and the engine's
 * transliteration (§4.3) is only the fallback for a member who wrote none.
 *
 * Four optional profile fields hold those spellings, keyed by **script**, not
 * by locale — en and es read the same Latin spelling, so a member is never
 * asked twice for one name. `username` stays what the member typed at signup:
 * it is the users-permissions login identifier, and the engine's source string.
 *
 * Pure: no store, no fetch. Every place that renders a member's name should
 * resolve it here rather than read `username` itself.
 */
import { detectScript, SCRIPT_OF, type Script } from './detect.js';
import { hasMixedScript } from './mixedScript.js';
import { isRealTranslation } from './hits.js';
import type { Locale, TranslationHit } from './types.js';

export type NameScript = Exclude<Script, 'unknown'>;

/** Profile field per script. Mirrors the 1.0b user schema. */
export const NAME_FIELD: Record<NameScript, 'nameLatin' | 'nameArabic' | 'nameCyrillic' | 'nameHebrew'> = {
    latin: 'nameLatin',
    arabic: 'nameArabic',
    cyrillic: 'nameCyrillic',
    hebrew: 'nameHebrew'
};

export const NAME_FIELDS = Object.values(NAME_FIELD);
export type NameField = (typeof NAME_FIELDS)[number];

/** Same ceiling as `username` in the manifest (`fields.js`) and the schema. */
export const NAME_MAX = 60;

/** The subset of a user's attributes this module reads. */
export interface NamedUser {
    username?: string | null;
    nameLatin?: string | null;
    nameArabic?: string | null;
    nameCyrillic?: string | null;
    nameHebrew?: string | null;
}

export type NameSource = 'own' | 'native' | 'engine' | 'raw';

export interface ResolvedName {
    text: string;
    /**
     * `own` — the member wrote it; not a translation, never labelled.
     * `native` — `username` is already in the reader's script.
     * `engine` — a machine transliteration; label it like any T3 string.
     * `raw` — `username` as typed, in a script the reader may not read.
     */
    source: NameSource;
}

/** Pull the attributes out of any user shape the app passes around:
 *  Strapi's `{ data: { attributes } }`, `{ attributes }`, or a flat object. */
export function namedUserOf(u: unknown): NamedUser | null {
    if (!u || typeof u !== 'object') return null;
    const o = u as Record<string, any>;
    if ('username' in o) return o as NamedUser;
    if (o.attributes && typeof o.attributes === 'object') return o.attributes as NamedUser;
    if (o.data !== undefined) return namedUserOf(o.data);
    return o as NamedUser;
}

/**
 * The four own-spelling fields of a user, for code that flattens a Strapi
 * user into `{ username, … }` — spread it next to `username` so the flat
 * shape still resolves through `displayName`. Absent fields are left out.
 */
export function nameFieldsOf(u: unknown): Partial<Pick<NamedUser, NameField>> {
    const user = namedUserOf(u);
    const out: Partial<Pick<NamedUser, NameField>> = {};
    if (!user) return out;
    for (const f of NAME_FIELDS) {
        const v = user[f];
        if (typeof v === 'string' && v.trim()) out[f] = v;
    }
    return out;
}

/** The script a string is written in, or `null` when no script holds it clearly. */
export function nameScriptOf(s: string | null | undefined, threshold = 0.7): NameScript | null {
    const { script, share, letters } = detectScript(typeof s === 'string' ? s : '');
    if (letters === 0 || script === 'unknown' || share < threshold) return null;
    return script;
}

/**
 * Resolve the name a reader in `locale` should see.
 *
 * @param hit the `transliterate` cache row for `username` in `locale`, if the
 *   caller read one. Used only when `allowEngine` is true — the reader's
 *   `autoTranslate` preference decides that, exactly as for every T3 string.
 *   The member's own spelling is their own words and ignores the preference.
 */
export function displayName(
    user: NamedUser | null | undefined,
    locale: Locale,
    opts: { hit?: TranslationHit | null; allowEngine?: boolean } = {}
): ResolvedName {
    const username = (user?.username ?? '').trim();
    const script = SCRIPT_OF[locale] as NameScript;

    const own = (user?.[NAME_FIELD[script]] ?? '').trim();
    if (own) return { text: own, source: 'own' };

    if (username && nameScriptOf(username) === script) return { text: username, source: 'native' };

    if (opts.allowEngine && isRealTranslation(opts.hit)) {
        return { text: (opts.hit as TranslationHit).text.trim(), source: 'engine' };
    }

    return { text: username, source: 'raw' };
}

const LOCALES = new Set<string>(['he', 'en', 'ar', 'ru', 'es']);

/**
 * The plain string a reader in `readerLocale` should see, for any user shape.
 * Server loaders (which know `locals.lang`) and the `$nameOf` store both use it.
 * An unknown locale renders `username` as typed.
 */
export function memberName(u: unknown, readerLocale: string | null | undefined): string {
    const user = namedUserOf(u);
    if (!user) return '';
    const loc = (readerLocale ?? '').slice(0, 2);
    if (!LOCALES.has(loc)) return (user.username ?? '').trim();
    return displayName(user, loc as Locale).text;
}

export type OwnNameCheck =
    | { ok: true; value: string | null }
    | { ok: false; reason: 'tooLong' | 'wrongScript' | 'mixedScript' };

/**
 * Validate what a member typed into one of the four fields.
 *
 * Empty clears the field (`value: null`). Otherwise every letter must be in
 * the field's own script — a `nameLatin` of `ברוך` is refused, not stored —
 * and no word may mix alphabets (the `check:script` failure mode).
 * Spaces, hyphens, apostrophes and dots are fine: they carry no script.
 */
export function checkOwnName(raw: unknown, script: NameScript): OwnNameCheck {
    const value = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
    if (!value) return { ok: true, value: null };
    if (value.length > NAME_MAX) return { ok: false, reason: 'tooLong' };
    if (hasMixedScript(value)) return { ok: false, reason: 'mixedScript' };
    if (nameScriptOf(value, 1) !== script) return { ok: false, reason: 'wrongScript' };
    return { ok: true, value };
}

/** The scripts a member is asked about: every one except the script `username` is already in. */
export function scriptsToAsk(username: string | null | undefined): NameScript[] {
    const own = nameScriptOf(username);
    return (['latin', 'arabic', 'cyrillic', 'hebrew'] as NameScript[]).filter((s) => s !== own);
}
