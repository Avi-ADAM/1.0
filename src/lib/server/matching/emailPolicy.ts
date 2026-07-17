/**
 * Sending policy for "new suggestion" emails — pure and testable.
 *
 * Two guards, both tunable here:
 *  - a send window in site-local time (Asia/Jerusalem): no suggestion mail at
 *    night. A suggestion created off-hours is stored with status 'new' and
 *    simply appears in the lev; it is not queued for later delivery.
 *  - a rolling per-user cap: at most MAX_SUGGESTION_EMAILS_PER_USER_PER_DAY
 *    suggestion emails per 24h, counted from `notifiedAt` on the user's
 *    existing match-suggestion rows (no extra bookkeeping collection).
 */

/** Max "new suggestion" emails per user per rolling 24 hours. */
export const MAX_SUGGESTION_EMAILS_PER_USER_PER_DAY = 3;

/** Local (Asia/Jerusalem) hours during which suggestion mail may be sent. */
export const SEND_WINDOW = { startHour: 8, endHour: 21 };

export const SITE_TIMEZONE = 'Asia/Jerusalem';

/** Rolling window used for the daily cap. */
export const CAP_WINDOW_HOURS = 24;

/** Is `now` inside the allowed local-time send window? */
export function isWithinSendWindow(now: Date = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone: SITE_TIMEZONE
    }).format(now)
  );
  return hour >= SEND_WINDOW.startHour && hour < SEND_WINDOW.endHour;
}

/** ISO timestamp of the start of the rolling cap window. */
export function capWindowStartIso(now: Date = new Date()): string {
  return new Date(now.getTime() - CAP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
}

/**
 * Given how many suggestion emails each user already got inside the window,
 * may this user receive one more?
 */
export function underDailyCap(sentInWindow: number): boolean {
  return sentInWindow < MAX_SUGGESTION_EMAILS_PER_USER_PER_DAY;
}
