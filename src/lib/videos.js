/**
 * The platform's own videos (YouTube ids), opened in `$lib/components/main/VideoModal.svelte`.
 *
 * Each is recorded in one language, and is offered only to readers of that language — a
 * Hebrew voice-over is not help for someone reading the site in Arabic. `videoFor` answers
 * that, so a page never decides it on its own.
 */

/** The general walkthrough of 1lev1 (home page "how it works"). */
export const VIDEO_HOW_IT_WORKS = 'l0d1yv6Qtz4';

/**
 * The concierge end to end — a wish, its plan, providers offering themselves, consent, a
 * rikma, the hours, payment, done (2:42). Recorded from the replayable flow in
 * video-tutorials/flows/concierge-e2e.json; a re-shoot gets a new id here.
 */
export const VIDEO_CONCIERGE = '03c1X5p1iL0';

/** Building an online shop on a rikma — the starter, products, orders (/shop hero). */
export const VIDEO_SHOP_BUILD = '3N3pDPfSi2w';

/**
 * From an idea to a rikma — the full guide to a consensual partnership (home hero, /vision,
 * /guid). The English cut will be its own id; add it here with ['en'].
 */
export const VIDEO_IDEA_TO_RIKMA = 'L2NDGpyIOqc';

/** @type {Record<string, string[]>} video id → the languages it speaks */
const LANGS = {
  [VIDEO_HOW_IT_WORKS]: ['he'],
  [VIDEO_CONCIERGE]: ['he'],
  [VIDEO_SHOP_BUILD]: ['he'],
  [VIDEO_IDEA_TO_RIKMA]: ['he']
};

/**
 * The id to play for a reader of `lang`, or null when the video does not speak it.
 * @param {string} id
 * @param {string | null | undefined} lang
 */
export function videoFor(id, lang) {
  return LANGS[id]?.includes(String(lang ?? '')) ? id : null;
}
