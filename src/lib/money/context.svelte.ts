/**
 * The reader's currency and today's rates, for every component on the page
 * (docs/PLAN_MULTI_CURRENCY.md D-C6, D-C9).
 *
 * Context, not a module store: on the server a module-level store is shared by
 * every concurrent request, and one visitor's currency would leak into
 * another's page (the same bug `+layout.server.js` documents for `locale`).
 * The root layout provides one `MoneyState` per app instance; `<Money>` and
 * `useMoney()` read it.
 *
 * Where the answer lives:
 *   cookie `currency`  — what SSR reads, so the first paint is already right;
 *   `User.currency`    — the account copy, so a second device inherits it;
 *   Accept-Language    — the guess for a visitor who never chose (hooks).
 */

import { getContext, setContext } from 'svelte';
import { convert, type FxTable } from './convert.js';
import { DEFAULT_CURRENCY, normalizeCode, type CurrencyCode } from './currencies.js';
import { formatMoney, type FormatOpts } from './format.js';

const KEY = Symbol('money');
export const CURRENCY_COOKIE = 'currency';

export class MoneyState {
  /** The currency this reader sees amounts in. */
  currency = $state<CurrencyCode>(DEFAULT_CURRENCY);
  /** True once the reader (or their account) chose it; false while it is a guess. */
  chosen = $state(false);
  fx = $state<FxTable | null>(null);
  lang = $state('he');

  constructor(init?: { currency?: string | null; chosen?: boolean; fx?: FxTable | null; lang?: string | null }) {
    this.currency = normalizeCode(init?.currency) ?? DEFAULT_CURRENCY;
    this.chosen = !!init?.chosen;
    this.fx = init?.fx ?? null;
    this.lang = init?.lang ?? 'he';
  }

  /**
   * `amount` (stored in `from`) as this reader should see it. `converted` is
   * false when no conversion happened — same currency, or no rate for it — and
   * then the text is the stored amount in its own currency, never a guess.
   */
  view(amount: number | null | undefined, from: CurrencyCode = DEFAULT_CURRENCY, opts: FormatOpts = {}) {
    const n = amount == null ? NaN : Number(amount);
    const original = formatMoney(n, from, this.lang, opts);
    if (from === this.currency) return { text: original, original, converted: false };
    const c = convert(n, from, this.currency, this.fx);
    if (c === null) return { text: original, original, converted: false };
    return {
      text: formatMoney(c, this.currency, this.lang, { ...opts, approx: opts.approx ?? true }),
      original,
      converted: true
    };
  }

  /** Just the text — for placeholders in `$t()` strings and attributes. */
  fmt(amount: number | null | undefined, from: CurrencyCode = DEFAULT_CURRENCY, opts: FormatOpts = {}): string {
    return this.view(amount, from, opts).text;
  }
}

/** Root layout only. */
export function provideMoney(state: MoneyState): MoneyState {
  setContext(KEY, state);
  return state;
}

/**
 * Outside a provider (a unit test, a component rendered in isolation) amounts
 * still render — in their own currency, unconverted, in Hebrew. Never mutated,
 * so sharing it across SSR requests leaks nothing.
 */
const FALLBACK = new MoneyState();

/** Call during component init. */
export function useMoney(): MoneyState {
  try {
    return getContext<MoneyState>(KEY) ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}

const RIKMA_KEY = Symbol('rikmaCurrency');
const BY_PROJECT_KEY = Symbol('currencyByProject');

/**
 * A page that shows amounts from several rikmas at once — the heart, the hub —
 * provides the lookup once, and every `<Money projectId=…>` under it resolves
 * its own. A getter, so it follows the store as it loads.
 */
export function provideProjectCurrencies(get: (projectId: string) => string | null | undefined) {
  setContext(BY_PROJECT_KEY, get);
}

/** The currency of one rikma by id, or null when this page has no such map. */
export function useProjectCurrency(): (projectId: unknown) => CurrencyCode | null {
  let get: ((projectId: string) => string | null | undefined) | undefined;
  try {
    get = getContext(BY_PROJECT_KEY);
  } catch {
    get = undefined;
  }
  return (projectId: unknown) =>
    projectId == null || !get ? null : normalizeCode(get(String(projectId)));
}

/**
 * Inside a rikma's pages (the moach layout) every stored amount is in that
 * rikma's currency. Providing it once there means a `<Money amount={x} />`
 * deep in the tree is right without every call site threading the project
 * through. A getter, so a project that loads later is still picked up.
 */
export function provideRikmaCurrency(get: () => string | null | undefined) {
  setContext(RIKMA_KEY, get);
}

/** The enclosing rikma's currency, or null outside one. Call during component init. */
export function useRikmaCurrency(): () => CurrencyCode | null {
  let get: (() => string | null | undefined) | undefined;
  try {
    get = getContext(RIKMA_KEY);
  } catch {
    get = undefined;
  }
  return () => normalizeCode(get?.());
}

/**
 * `<Money>` as a function, for text that can't hold a component: a `$t()`
 * placeholder, an attribute, a toast. Same rules — the enclosing rikma's
 * currency when `from` is omitted, `≈` when converted. Call during component init.
 */
export function useFormatMoney() {
  const money = useMoney();
  const rikma = useRikmaCurrency();
  return (amount: number | string | null | undefined, from?: string | null, opts: FormatOpts = {}) =>
    money.fmt(
      amount == null || amount === '' ? null : Number(amount),
      normalizeCode(from) ?? rikma() ?? DEFAULT_CURRENCY,
      opts
    );
}

/** Writes the device copy. Not httpOnly: it names a currency, and the settings page sets it. */
export function writeCurrencyCookie(code: CurrencyCode) {
  try {
    if (typeof document === 'undefined') return;
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax${secure}`;
  } catch {
    // Cookies blocked: the choice holds for this session in the state object.
  }
}

let mirrorTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * The reader picks a currency. The page updates at once; the cookie is the
 * device copy SSR reads next time; the account copy follows on a debounce so
 * a reader scrolling through the picker is one write, not ten.
 */
export function setDisplayCurrency(state: MoneyState, value: unknown, opts: { mirror?: boolean } = {}) {
  const code = normalizeCode(value);
  if (!code) return;
  state.currency = code;
  state.chosen = true;
  writeCurrencyCookie(code);
  if (opts.mirror === false || typeof window === 'undefined') return;
  if (mirrorTimer) clearTimeout(mirrorTimer);
  mirrorTimer = setTimeout(async () => {
    mirrorTimer = null;
    try {
      const { executeAction } = await import('$lib/client/actionClient');
      await executeAction('updateUserBasic', { currency: code }, { showErrorToast: false, skipUpdateStrategy: true });
    } catch {
      // A preference sync failing is not worth a toast; this device already has it.
    }
  }, 700);
}

/**
 * Adopt the account's currency on a device that has not chosen one. A local
 * choice is never overwritten — it is the reader's latest word on this device.
 */
export function adoptCurrencyFromProfile(state: MoneyState, serverValue: unknown): boolean {
  const code = normalizeCode(serverValue);
  if (!code || state.chosen) return false;
  setDisplayCurrency(state, code, { mirror: false });
  return true;
}

let fetching: Promise<void> | null = null;

/** The layout had no rates in time (cold instance, mobile build): ask `/api/fx` once. */
export function ensureRates(state: MoneyState, fetchFn: typeof fetch = fetch): Promise<void> {
  if (state.fx || typeof window === 'undefined') return Promise.resolve();
  fetching ??= fetchFn('/api/fx')
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (j?.table) state.fx = j.table;
    })
    .catch(() => {})
    .finally(() => {
      fetching = null;
    });
  return fetching;
}
