/**
 * What makes a digest a digest and not spam — PLAN_DAILY_DIGEST §5.
 *
 * Modelled on `src/lib/server/matching/emailPolicy.ts`: pure, every threshold
 * named here, and the answer is a reason, not just a boolean — `?dry=1` shows
 * *why* a user would not get one, which is the tool TIMEGRAMA never had.
 *
 * The five rules (§5.1):
 *  1. an empty digest is not sent;
 *  2. at most one a day (20h, not 24h, so a run half an hour late does not
 *     skip a day);
 *  3. only inside the morning send window — outside it nothing is queued;
 *  4. "nothing changed since yesterday" counts as empty, except a vote that
 *     turned urgent overnight;
 *  5. the user decides: `frequency: 'off'` stops it, `noMail` turns off the
 *     mail channel only.
 *
 * State comes from the `user-digest` row. **No row = the default**, never
 * "unsubscribed" — the project's null rule (`lifecycle`, `stipendPolicy`):
 * today nobody has a row, and every one of them is a daily reader.
 */

import type { DigestCounts, DigestPayload } from './compose.js';
import { SITE_TIMEZONE } from './work.js';

/** Local (site) hours during which a digest may go out. */
export const DIGEST_SEND_WINDOW = { startHour: 7, endHour: 9 };

/** Minimum gap between two digests to the same user. */
export const MIN_HOURS_BETWEEN_DIGESTS = 20;

/** Weekly readers get theirs on this local weekday (0 = Sunday). */
export const WEEKLY_DAY = 0;

export type DigestFrequency = 'daily' | 'weekly' | 'off';
export type DigestChannel = 'mail' | 'telegram' | 'push' | 'whatsapp';

/** Channels with a sender today. WhatsApp is §7 / phase 6. */
export const DELIVERABLE_CHANNELS: DigestChannel[] = ['telegram', 'mail', 'push'];

export interface DigestState {
  lastSentAt?: string | null;
  lastCounts?: DigestCounts | null;
  frequency?: DigestFrequency | null;
  channels?: Partial<Record<DigestChannel, boolean>> | null;
}

export interface DigestContact {
  email?: string | null;
  noMail?: boolean | null;
  telegramId?: string | null;
  pushDevices?: number | null;
}

export type DigestSkipReason =
  | 'off'
  | 'notThisWeekday'
  | 'empty'
  | 'unchanged'
  | 'tooSoon'
  | 'outsideWindow'
  | 'noChannel'
  /** The votes read failed — set by the run, never by decideDigest. */
  | 'failedRead';

// Both shapes carry every field: the project's jsconfig is not strict, and
// without strictNullChecks TS will not narrow on `send`.
export type DigestDecision =
  | { send: true; reason: null; channels: DigestChannel[]; forced: boolean }
  | { send: false; reason: DigestSkipReason; channels: DigestChannel[]; forced: false };

function localParts(now: Date): { hour: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SITE_TIMEZONE,
    hour: 'numeric',
    hour12: false,
    weekday: 'short'
  }).formatToParts(now);
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  // "24" is how some engines spell midnight with hour12:false.
  const hour = Number(hourStr) % 24;
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
  return { hour, weekday: weekday < 0 ? 0 : weekday };
}

export function isWithinDigestWindow(now: Date = new Date()): boolean {
  const { hour } = localParts(now);
  return hour >= DIGEST_SEND_WINDOW.startHour && hour < DIGEST_SEND_WINDOW.endHour;
}

/** null / unknown ⇒ daily (the null rule). */
export function effectiveFrequency(f: string | null | undefined): DigestFrequency {
  return f === 'weekly' || f === 'off' ? f : 'daily';
}

/**
 * Which channels this user's digest goes to.
 *
 * With explicit preferences: the ones they turned on that can actually reach
 * them. Without: **one** channel — Telegram when linked, else mail, else a
 * push reminder. The same digest in three places reads as being chased
 * (§6.4); more than one is the user's choice, never the default.
 */
export function resolveChannels(
  prefs: DigestState['channels'],
  contact: DigestContact
): DigestChannel[] {
  const reachable: Record<DigestChannel, boolean> = {
    telegram: !!contact.telegramId,
    mail: !!contact.email && contact.noMail !== true,
    push: (contact.pushDevices ?? 0) > 0,
    whatsapp: false
  };

  if (prefs && Object.values(prefs).some((v) => v === true)) {
    return DELIVERABLE_CHANNELS.filter((c) => prefs[c] === true && reachable[c]);
  }

  const first = DELIVERABLE_CHANNELS.find((c) => reachable[c]);
  return first ? [first] : [];
}

/** Rule 4: same numbers as last time, nothing new, nothing newly urgent. */
export function isUnchanged(current: DigestCounts, last: DigestCounts | null | undefined): boolean {
  if (!last) return false;
  if (current.whatsNew > 0) return false;
  const prevUrgent = new Set(last.urgentKeys ?? []);
  if (current.urgentKeys.some((k) => !prevUrgent.has(k))) return false;
  const keys: (keyof DigestCounts)[] = [
    'votes',
    'urgent',
    'missions',
    'dormantSoon',
    'tasksOpen',
    'overdue',
    'dueSoon',
    'suggestions',
    'freshSuggestions'
  ];
  return keys.every((k) => current[k] === (last[k] ?? 0));
}

export interface DecideOptions {
  now?: Date;
  /** Testing only: skips the send window and the once-a-day gap — nothing else. */
  force?: boolean;
}

export function decideDigest(
  payload: DigestPayload,
  counts: DigestCounts,
  state: DigestState | null | undefined,
  contact: DigestContact,
  { now = new Date(), force = false }: DecideOptions = {}
): DigestDecision {
  const channels = resolveChannels(state?.channels ?? null, contact);
  const skip = (reason: DigestSkipReason): DigestDecision => ({
    send: false,
    reason,
    channels,
    forced: false
  });

  const frequency = effectiveFrequency(state?.frequency);
  if (frequency === 'off') return skip('off');
  if (frequency === 'weekly' && !force && localParts(now).weekday !== WEEKLY_DAY) {
    return skip('notThisWeekday');
  }

  if (payload.isEmpty) return skip('empty');
  if (isUnchanged(counts, state?.lastCounts)) return skip('unchanged');

  if (!force) {
    const last = state?.lastSentAt ? new Date(state.lastSentAt).getTime() : NaN;
    if (Number.isFinite(last) && now.getTime() - last < MIN_HOURS_BETWEEN_DIGESTS * 60 * 60 * 1000) {
      return skip('tooSoon');
    }
    if (!isWithinDigestWindow(now)) return skip('outsideWindow');
  }

  if (channels.length === 0) return skip('noChannel');
  return { send: true, reason: null, channels, forced: force };
}
