import { redirectToMeetingsApp } from '$lib/server/meetingsRedirect.js';

export function load({ url }) {
  redirectToMeetingsApp(url);
}
