/**
 * deckPosition — which card the heart is parked on.
 *
 * The swiper had no memory: every time the feed re-emitted (a socket message, a
 * clock tick, a filter toggle) the `{#key swiperKey}` tore the whole thing down
 * and rebuilt it at slide 0, so a user reading card 14 was thrown back to the
 * start. The native deck keeps its scroll position on its own for most changes,
 * but not all — removing a card *before* the current one shifts the content
 * under a fixed scrollTop — so the deck re-anchors explicitly against the id
 * kept here.
 *
 * Stored by `coinlapach` (the item identity used everywhere else in the heart),
 * never by index: indices move when cards resolve, ids don't. A card that left
 * the feed simply isn't found and the deck stays where it is.
 *
 * sessionStorage, not localStorage: coming back to the heart in the same tab
 * should resume where you were, opening it tomorrow should start at the top.
 */

const KEY = 'lev:deck:card';

function initial() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    /* private mode / disabled storage — memory still works for this session */
    return null;
  }
}

export const deckPosition = $state({ id: initial() });

/** @param {string|number|null|undefined} id */
export function rememberCard(id) {
  const v = id === null || id === undefined ? null : String(id);
  if (deckPosition.id === v) return;
  deckPosition.id = v;
  if (typeof window === 'undefined') return;
  try {
    if (v === null) window.sessionStorage.removeItem(KEY);
    else window.sessionStorage.setItem(KEY, v);
  } catch {
    /* ignore */
  }
}
