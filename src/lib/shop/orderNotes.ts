/**
 * The order's system notes, in the *reader's* language.
 *
 * `Order.note` is one free-text column. It holds what the buyer wrote (their
 * own words, in their own language) and what the server noticed while planning
 * the order — a switched-off variant, an oversold line, a delivery fee that
 * stayed separate. Those used to be Hebrew sentences written at write time, so
 * an English, Arabic, Russian or Spanish member reading the order got Hebrew.
 *
 * A note is persisted once and read later, possibly by a different member in a
 * different language, so translating it when it is *written* is not enough.
 * The server now stores a language-neutral marker
 * (`[[order.note.<name>|<url-encoded JSON>]]`) and the screen renders it with
 * `$t()` (PLAN_EN_READINESS stage 4.2). The five locales live in
 * `shop.order.note.*`; old rows whose notes are plain text still render as
 * they always did, because only markers are replaced.
 *
 * Numbers are stored raw and formatted for the reader (`formatMoney` when the
 * note carries a currency, else a locale number), never frozen into the text.
 */

import { formatMoney, intlLocale } from '../money/format.js';
import type { CurrencyCode } from '../money/currencies.js';

export type OrderNoteTranslate = (key: string, params?: Record<string, unknown>) => string;
export type OrderNoteParams = Record<string, unknown>;

/** The only thing written into `Order.note` for a fact the server noticed. */
export function noteLine(name: string, params: OrderNoteParams = {}): string {
    return `[[order.note.${name}|${encodeURIComponent(JSON.stringify(params))}]]`;
}

/** A marker's payload is percent-encoded, so a user's `]` can never end it. */
const NOTE_MARK = /\[\[order\.note\.([A-Za-z0-9_]+)\|([^\]]*)\]\]/g;

/** Params that are amounts, not counts: format them for the reader's locale. */
const MONEY_PARAMS = new Set([
    'fee', 'charged', 'computed', 'paid', 'catalog', 'gap', 'amount', 'catalogTotal', 'configured'
]);

function amountText(value: number, lang: string): string {
    try {
        return new Intl.NumberFormat(intlLocale(lang), { maximumFractionDigits: 2 }).format(value);
    } catch {
        return String(value);
    }
}

const METHOD_LABELS: Record<string, (t: OrderNoteTranslate) => string> = {
    bit: (t) => t('shop.order.note.method.bit'),
    paybox: (t) => t('shop.order.note.method.paybox'),
    transfer: (t) => t('shop.order.note.method.transfer'),
    cash: (t) => t('shop.order.note.method.cash'),
    other: (t) => t('shop.order.note.method.other')
};

function methodLabel(t: OrderNoteTranslate, method: unknown): string {
    const of = METHOD_LABELS[String(method ?? '')];
    return (of ?? METHOD_LABELS.other)(t);
}

/**
 * One renderer per note name. The keys are literal `t('shop.order.note.…')`
 * calls on purpose: `check:i18n` only sees static prefixes, and a computed
 * `t('shop.order.note.' + name)` would hide the whole namespace from it.
 */
const RENDERERS: Record<string, (t: OrderNoteTranslate, p: OrderNoteParams) => string> = {
    variantOff: (t, p) => t('shop.order.note.variantOff', p),
    belowMin: (t, p) => t('shop.order.note.belowMin', p),
    aboveMax: (t, p) => t('shop.order.note.aboveMax', p),
    oversold: (t, p) => t('shop.order.note.oversold', p),
    shippingFeeSeparate: (t, p) => t('shop.order.note.shippingFeeSeparate', p),
    amountMismatch: (t, p) => t('shop.order.note.amountMismatch', p),
    belowCatalog: (t, p) => t('shop.order.note.belowCatalog', p),
    belowCatalogOverArranged: (t, p) => t('shop.order.note.belowCatalogOverArranged', p),
    shippingOptionMissing: (t, p) => t('shop.order.note.shippingOptionMissing', p),
    shippingFeeDifferent: (t, p) => t('shop.order.note.shippingFeeDifferent', p),
    arrangedPaid: (t, p) =>
        t('shop.order.note.arrangedPaid', {
            ...p,
            methodLabel: methodLabel(t, p.method),
            underPhrase: p.under ? t('shop.order.note.belowCatalogShort', p) : ''
        })
};

/**
 * Replace every system marker in an order note with its translation in `lang`.
 * Plain text — the buyer's own words, notes written before this change — is
 * returned untouched.
 */
export function renderOrderNote(
    note: string | null | undefined,
    t: OrderNoteTranslate,
    lang: string | null | undefined = 'he'
): string | null {
    if (!note) return null;
    const locale = String(lang ?? 'he');
    const out = note.replace(NOTE_MARK, (_match, name: string, payload: string) => {
        let params: OrderNoteParams;
        try {
            params = JSON.parse(decodeURIComponent(payload)) as OrderNoteParams;
        } catch {
            return t('shop.order.note.unknown');
        }
        if (!params || typeof params !== 'object') return t('shop.order.note.unknown');
        const currency = typeof params.currency === 'string' ? (params.currency as CurrencyCode) : null;
        const p: OrderNoteParams = { ...params };
        for (const key of MONEY_PARAMS) {
            if (typeof p[key] !== 'number') continue;
            p[key] = currency
                ? formatMoney(p[key] as number, currency, locale)
                : amountText(p[key] as number, locale);
        }
        const render = RENDERERS[name];
        // A note from a newer deploy that this one cannot read must never show
        // the raw marker to a person.
        return render ? render(t, p) : t('shop.order.note.unknown');
    });
    // `orderNoteOf` caps the note at 4000 characters. A marker cut in half
    // would otherwise show its raw `[[order.note.…` prefix to the reader.
    return out.replace(/\[\[order\.note\.[^\]]*$/, '');
}
