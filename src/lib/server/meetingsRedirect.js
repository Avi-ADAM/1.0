// Meetings are managed only on the meetings app (magik-meetings). The old
// /meeting pages here forward there, so links already sent in notifications,
// emails and Telegram buttons keep working.
import { redirect } from '@sveltejs/kit';
import { meetingsOrigin } from '$lib/server/demo/demoMeeting.js';
import { MEETINGS_APP_URL } from '$lib/meetings/goldenMeeting.js';

/**
 * @param {URL} url - the request URL; its path and query are carried over
 * @returns {never}
 */
export function redirectToMeetingsApp(url) {
  const origin = meetingsOrigin() || MEETINGS_APP_URL;
  redirect(301, origin + url.pathname + url.search);
}
