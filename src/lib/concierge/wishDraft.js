/**
 * The guest's wish, kept on this device across the trip through registration.
 *
 * A visitor can write a whole wish on the public composer (/wish/new) before
 * an account exists. Registration then takes them through the agreement, the
 * signup form and an email confirmation — and the confirmation link almost
 * always opens in a *new tab*. The draft used to live in `sessionStorage`,
 * which is per-tab, so exactly the people who did everything right arrived on
 * /concierge/new to an empty form. `localStorage` survives the new tab and a
 * browser restart; the expiry keeps a months-old wish from resurfacing.
 *
 * It does not survive a change of device — confirming on the phone after
 * writing on the laptop starts over. /signup/check-email says so.
 *
 * `sendOnReturn` separates "I pressed send, then had to register" (the wish is
 * published by itself the first time the new member reaches the composer)
 * from "I registered to see who matched" (restored for them, not sent).
 */

export const DRAFT_KEY = 'wishDraft.v2';
/** Where the V1 composer stashed it — read once, so an in-flight signup is not lost. */
const LEGACY_KEY = 'wishDraft';
/** Two weeks: long enough to confirm an email; short enough not to haunt. */
export const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * sessionStorage key for the homepage's one-line wish field: the text the
 * visitor typed there, waiting for /wish/new to pick it up as the title.
 */
export const WISH_PREFILL_KEY = 'wishPrefill';

/**
 * @typedef {Record<string, any> & { savedAt?: number, sendOnReturn?: boolean }} WishDraft
 */

/** @param {() => Storage} get */
function storage(get) {
  try {
    return get();
  } catch {
    // Private mode / blocked site data throws on the accessor itself.
    return null;
  }
}

/**
 * Whether a stored draft is still worth restoring.
 *
 * @param {unknown} d
 * @param {number} [now]
 * @returns {d is WishDraft}
 */
export function isLiveDraft(d, now = Date.now()) {
  if (!d || typeof d !== 'object') return false;
  const draft = /** @type {WishDraft} */ (d);
  const hasContent =
    (typeof draft.title === 'string' && draft.title.trim() !== '') ||
    (typeof draft.body === 'string' && draft.body.trim() !== '');
  if (!hasContent) return false;
  if (typeof draft.savedAt !== 'number') return true;
  return now - draft.savedAt <= DRAFT_TTL_MS;
}

/**
 * Store the draft. Returns false when the browser would not keep it.
 *
 * @param {WishDraft} draft
 * @param {{ sendOnReturn?: boolean }} [opts]
 */
export function saveGuestDraft(draft, opts = {}) {
  const ls = storage(() => localStorage);
  if (!ls) return false;
  try {
    ls.setItem(
      DRAFT_KEY,
      JSON.stringify({
        ...draft,
        sendOnReturn: opts.sendOnReturn === true,
        savedAt: Date.now()
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * The draft waiting on this device, if any — expired ones are dropped here.
 *
 * @returns {WishDraft | null}
 */
export function readGuestDraft() {
  const ls = storage(() => localStorage);
  const ss = storage(() => sessionStorage);
  /** @type {unknown} */
  let found = null;
  try {
    const raw = ls?.getItem(DRAFT_KEY);
    if (raw) found = JSON.parse(raw);
  } catch {
    found = null;
  }
  if (!found) {
    try {
      const legacy = ss?.getItem(LEGACY_KEY);
      // The V1 stash was only ever written by "publish", so it was a send.
      if (legacy) found = { ...JSON.parse(legacy), sendOnReturn: true };
    } catch {
      found = null;
    }
  }
  if (isLiveDraft(found)) return found;
  if (found) clearGuestDraft();
  return null;
}

export function clearGuestDraft() {
  try {
    storage(() => localStorage)?.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to clear */
  }
  try {
    storage(() => sessionStorage)?.removeItem(LEGACY_KEY);
  } catch {
    /* nothing to clear */
  }
}
