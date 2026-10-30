// Golden meetings live on their own site (magik-meetings, meetings.1lev1.com).
// This app keeps only the availability switch and the doors into that site;
// every place that calls a meeting builds its link here, so the query contract
// with the meetings app (`new`, `with`, `title`) has exactly one writer.

export const MEETINGS_APP_URL = 'https://meetings.1lev1.com';

/** The meetings app reads at most this many invitees from a link. */
export const MAX_INVITEES = 50;

/**
 * A page on the meetings app.
 * @param {string} [path]
 */
export function meetingsAppUrl(path = '/meeting') {
  return MEETINGS_APP_URL + (path.startsWith('/') ? path : '/' + path);
}

/**
 * Normalise invitee ids: numeric only, de-duplicated, capped.
 * @param {Array<string|number|null|undefined>} ids
 * @returns {string[]}
 */
export function inviteeIds(ids) {
  /** @type {string[]} */
  const out = [];
  for (const raw of ids ?? []) {
    const id = String(raw ?? '').trim();
    if (!/^\d+$/.test(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= MAX_INVITEES) break;
  }
  return out;
}

/**
 * Link that opens the meetings app with a new golden meeting already filled in.
 * The creator is added there automatically, so `withIds` may or may not include
 * the current user.
 *
 * @param {{ withIds?: Array<string|number|null|undefined>, title?: string }} [opts]
 */
export function goldenMeetingHref({ withIds = [], title = '' } = {}) {
  const params = new URLSearchParams({ new: '1' });
  const ids = inviteeIds(withIds);
  if (ids.length) params.set('with', ids.join(','));
  const name = String(title ?? '').trim().slice(0, 120);
  if (name) params.set('title', name);
  return meetingsAppUrl('/meeting') + '?' + params.toString();
}
