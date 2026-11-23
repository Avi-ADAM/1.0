/**
 * The one way the app reports a funnel event (docs/tbd/PLAN_INHOUSE_ANALYTICS.md).
 *
 * Events go to our own Umami (pulse.1lev1.com) and, until stage A4, also to
 * Vercel Analytics so the two can be compared side by side. Nothing in the app
 * imports `@vercel/analytics` or touches `window.umami` directly — only this.
 *
 * The allow-list is the privacy guarantee, not a nicety: an event name or a
 * property key that is not listed below is dropped, and every value must be a
 * short enum-like string, a number or a boolean. So a name, an email, a user
 * id or a signup token cannot reach the analytics store, whatever a call site
 * passes. Adding an event means adding it here, on purpose.
 *
 * Never throws and never awaits: analytics must not be able to break a click.
 */
import { track as vercelTrack } from '@vercel/analytics';

/** @type {Readonly<Record<string, readonly string[]>>} event → allowed property keys */
export const EVENTS = Object.freeze({
  /** A click on the home page — the step after "arrived and left without one". */
  home_cta: ['cta'],
  /** Left /hascama for the extended agreement on agreement.1lev1.com. */
  agreement_out: ['from'],
  /** Came back from it (`?agreed=true` on /hascama). */
  agreement_back: [],
  /** Pressed sign on /hascama. */
  sign_try: ['full'],
  /** The form stopped them, and where. */
  sign_invalid: ['field'],
  /** /api/chezin accepted the signature. */
  sign_ok: ['full'],

  // The supplier funnel (docs/inprogress/PLAN_SUPPLIER_GROWTH.md SG0). `entry` names
  // the door: `join` = the public /join/supplier, `onboard` = signed in.
  /** Opened a supplier door. */
  supplier_entry: ['entry'],
  /** Asked for a draft of their business; `source` = url | text. */
  business_analyze: ['entry', 'source'],
  /** The draft came back (`ok`), or did not and why (`reason`). */
  business_analyzed: ['entry', 'ok', 'reason', 'products'],
  /** A guest left name + email and was sent on to the studio. */
  supplier_prepared: ['ok'],
  /** The one review screen opened; `mode` = member | studio. */
  blueprint_review: ['mode'],
  /** "Create" on it succeeded. */
  blueprint_created: ['rows']
});

/** Long enough for an enum, too short for an address or a token. */
const MAX_VALUE_LEN = 32;
/** Lowercase identifiers only: `join`, `infobox`, `email`. No `@`, no spaces. */
const SAFE_STRING = /^[a-z0-9_-]+$/;

/**
 * @param {string} name
 * @param {Record<string, unknown>} [props]
 * @returns {Record<string, string | number | boolean> | null} the props that may leave, or null when the event may not
 */
export function sanitize(name, props = {}) {
  const allowed = EVENTS[name];
  if (!allowed) return null;
  /** @type {Record<string, string | number | boolean>} */
  const out = {};
  for (const key of allowed) {
    const v = props?.[key];
    if (typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) out[key] = v;
    else if (typeof v === 'string' && v.length <= MAX_VALUE_LEN && SAFE_STRING.test(v)) out[key] = v;
  }
  return out;
}

/**
 * @param {keyof typeof EVENTS} name
 * @param {Record<string, unknown>} [props]
 */
export function track(name, props) {
  try {
    const data = sanitize(name, props);
    if (!data) return;
    if (typeof window === 'undefined') return;
    const umami = /** @type {any} */ (window).umami;
    if (umami && typeof umami.track === 'function') {
      umami.track(name, data).catch?.(() => {});
    }
    vercelTrack(name, data);
  } catch {
    // swallowed on purpose: see the header
  }
}

/**
 * Umami's `data-before-send` hook. The script tag already strips the query
 * and the hash; this is the second lock, because `/signup?…&un=` and the
 * agreement link both carry a person's name in the URL. It also drops the
 * referrer's query for the same reason.
 *
 * @param {string} _type
 * @param {{ url?: string, referrer?: string }} payload
 */
export function beforeSend(_type, payload) {
  try {
    for (const key of /** @type {const} */ (['url', 'referrer'])) {
      const v = payload?.[key];
      if (typeof v === 'string') payload[key] = v.replace(/[?#].*$/, '');
    }
    return payload;
  } catch {
    return false; // a payload we could not clean is not sent at all
  }
}

/** The `1lev1.com` website in our Umami (pulse.1lev1.com). Not a secret. */
export const PULSE_WEBSITE_ID = '90036726-6c43-46dd-978d-cd2f1122e54e';

/** Global name the script tag points `data-before-send` at. */
export const BEFORE_SEND_GLOBAL = '__pulseBeforeSend';

/**
 * Add the Umami tracker to the page once. A blank website id (dev, preview,
 * a fork) loads nothing, so only production fills the dashboard.
 *
 * @param {{ websiteId?: string, src?: string }} opts
 */
export function loadPulse({ websiteId, src = 'https://pulse.1lev1.com/p.js' }) {
  if (typeof document === 'undefined' || !websiteId) return;
  if (document.querySelector('script[data-pulse]')) return;
  /** @type {any} */ (window)[BEFORE_SEND_GLOBAL] = beforeSend;
  const s = document.createElement('script');
  s.defer = true;
  s.src = src;
  s.dataset.pulse = '';
  s.dataset.websiteId = websiteId;
  s.dataset.domains = '1lev1.com,www.1lev1.com';
  s.dataset.excludeSearch = 'true';
  s.dataset.excludeHash = 'true';
  s.dataset.doNotTrack = 'true';
  s.dataset.beforeSend = BEFORE_SEND_GLOBAL;
  document.head.appendChild(s);
}
