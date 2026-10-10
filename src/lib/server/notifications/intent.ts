/**
 * Which channels a notification goes out on — decided here, once, from what
 * the notification asks of the person reading it. A config states its
 * `intent`; it does not pick channels (docs/inprogress/PLAN_REALTIME_MIGRATION.md §6).
 *
 * The tiers follow the consent rule: silence is consent, so a notification
 * that waits for someone's answer — almost always with a silence clock
 * running against them — must reach them wherever they can be reached, or
 * their silence is ignorance, not consent. Every channel filters on its own
 * (no telegramId / no device / `noMail` ⇒ skipped), so "all four" means
 * "every channel this person set up". Email is the one channel everybody
 * has: `consent` emails everyone, and `personal` / `outcome` email whoever has
 * neither push nor telegram (`emailRecipients`), so nobody is left out.
 *
 * | intent     | what it asks of the reader                                         | channels                                  |
 * |------------|--------------------------------------------------------------------|-------------------------------------------|
 * | `consent`  | their answer is awaited (sign, approve, counter, take a request)   | socket push telegram email                |
 * | `personal` | about them or to them, nothing awaited (accepted, paid, a message) | socket push telegram (+email if neither)  |
 * | `outcome`  | a rikma-wide result that changes shares, money or membership       | socket push (+email if no push)           |
 * | `ambient`  | activity in a rikma they belong to                                 | socket                                    |
 */

import type { NotificationChannel } from '../actions/types';

export const NOTIFICATION_INTENTS = ['consent', 'personal', 'outcome', 'ambient'] as const;
export type NotificationIntent = (typeof NOTIFICATION_INTENTS)[number];

export const CHANNELS_BY_INTENT: Readonly<Record<NotificationIntent, readonly NotificationChannel[]>> = {
  consent: ['socket', 'push', 'telegram', 'email'],
  personal: ['socket', 'push', 'telegram'],
  outcome: ['socket', 'push'],
  ambient: ['socket']
};

/** The channels that reach a person who is not looking at the site. */
export const EXTERNAL_CHANNELS: readonly NotificationChannel[] = ['push', 'telegram', 'email'];

export type IntentSource =
  | NotificationIntent
  | ((params: Record<string, any>, result: any) => NotificationIntent);

/**
 * The channels for one notification. `intent` wins over a legacy `channels`
 * list; a config with neither falls back to socket only, which is what an
 * unconfigured notification has always meant in practice.
 */
export function resolveChannels(
  config: { intent?: IntentSource; channels?: readonly NotificationChannel[] },
  params: Record<string, any> = {},
  result: any = undefined
): NotificationChannel[] {
  if (config.intent) {
    const intent = typeof config.intent === 'function' ? config.intent(params, result) : config.intent;
    const channels = CHANNELS_BY_INTENT[intent];
    if (channels) return [...channels];
    console.warn(`[notifications] unknown intent "${String(intent)}" — sending on socket only`);
    return ['socket'];
  }
  return config.channels ? [...config.channels] : ['socket'];
}

/**
 * A vote on a rikma proposal. `consent` goes out when a round *opens* — a
 * proposal or a counter, the moment the silence clock starts or resets for
 * everyone else. A signature on a round that is already on the table resets
 * nothing, so it stays on the site; the round's own notice already reached
 * every channel. Maturing it (or closing it on an all-no) is an `outcome`.
 *
 * Handlers say which through their result: `data.consensus` / `data.archived`
 * for the end of the vote, `data.opensRound` when this vote put a version on
 * the table.
 */
export function voteIntent(_params: Record<string, any>, result: any): NotificationIntent {
  const d = result?.data ?? {};
  if (d.consensus === true || d.archived === true) return 'outcome';
  if (d.opensRound === true) return 'consent';
  return 'ambient';
}

type Reachable ={ telegramId?: string | null; machshirs?: any[] | null };

/** Would this notification reach the person on push or telegram at all? */
function reachedElsewhere(user: Reachable, channels: readonly NotificationChannel[]): boolean {
  if (channels.includes('telegram') && String(user.telegramId ?? '').trim() !== '') return true;
  // Same test PushService applies per device: a device without a subscription is skipped.
  if (channels.includes('push') && (user.machshirs ?? []).some((m) => m?.attributes?.jsoni)) return true;
  return false;
}

/**
 * Who gets the email. `consent` (or a legacy list with `email`) — everyone.
 * Anything else that leaves the site (push / telegram) — whoever has neither
 * set up, so a member with no app and no bot still hears about it. Socket-only
 * (`ambient`) — nobody.
 */
export function emailRecipients<U extends Reachable>(users: U[], channels: readonly NotificationChannel[]): U[] {
  if (channels.includes('email')) return users;
  if (!channels.includes('push') && !channels.includes('telegram')) return [];
  return users.filter((u) => !reachedElsewhere(u, channels));
}

/** Languages the hard-coded `{he, en, ar}` templates are written in. */
const TEMPLATE_LANGS = ['he', 'en', 'ar'] as const;
type TemplateLang = (typeof TEMPLATE_LANGS)[number];

/**
 * The template language for a recipient — the recipient's own, never the
 * sender's. A reader in a locale the templates don't cover (ru, es) gets
 * English, the one they are likelier to read than the sender's Hebrew.
 */
export function recipientTemplateLang(userLang: string | null | undefined): TemplateLang {
  if (!userLang) return 'he';
  return (TEMPLATE_LANGS as readonly string[]).includes(userLang) ? (userLang as TemplateLang) : 'en';
}
