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
 * | `review`   | a routine claim they may look at; silence is the expected answer   | socket + ONE of telegram / push / email   |
 * | `personal` | about them or to them, nothing awaited (accepted, paid, a message) | socket push telegram (+email if neither)  |
 * | `outcome`  | a rikma-wide result that changes shares, money or membership       | socket push (+email if no push)           |
 * | `ambient`  | activity in a rikma they belong to                                 | socket                                    |
 *
 * `review` is still a consent notice — a silence clock runs — so it must reach
 * every member; it just does not need to reach them twice. A partner's saved
 * timer is the case: it happens many times a week, and an email *and* a
 * telegram for each one teaches people to ignore both (`deliveryPlan`).
 */

import type { NotificationChannel } from '../actions/types';

export const NOTIFICATION_INTENTS = ['consent', 'review', 'personal', 'outcome', 'ambient'] as const;
export type NotificationIntent = (typeof NOTIFICATION_INTENTS)[number];

/** Channels that may carry the notice; for `review` each person gets only one of them (`deliveryPlan`). */
export const CHANNELS_BY_INTENT: Readonly<Record<NotificationIntent, readonly NotificationChannel[]>> = {
  consent: ['socket', 'push', 'telegram', 'email'],
  review: ['socket', 'push', 'telegram', 'email'],
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
export function resolveIntent(
  config: { intent?: IntentSource },
  params: Record<string, any> = {},
  result: any = undefined
): NotificationIntent | undefined {
  if (!config.intent) return undefined;
  return typeof config.intent === 'function' ? config.intent(params, result) : config.intent;
}

export function resolveChannels(
  config: { intent?: IntentSource; channels?: readonly NotificationChannel[] },
  params: Record<string, any> = {},
  result: any = undefined
): NotificationChannel[] {
  if (config.intent) {
    const intent = resolveIntent(config, params, result) as NotificationIntent;
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

export interface DeliveryPlan<U> {
  telegram: U[];
  push: U[];
  email: U[];
}

/**
 * Who is reached on which channel outside the site.
 *
 * Every intent but `review` sends each channel to everyone on it (email per
 * `emailRecipients`). `review` gives each person exactly one: telegram if they
 * connected the bot — something they set up on purpose and read as a message —
 * else push if they have a live device, else email, which everybody has.
 */
export function deliveryPlan<U extends Reachable>(
  users: U[],
  channels: readonly NotificationChannel[],
  intent?: NotificationIntent
): DeliveryPlan<U> {
  if (intent !== 'review') {
    return {
      telegram: channels.includes('telegram') ? users : [],
      push: channels.includes('push') ? users : [],
      email: emailRecipients(users, channels)
    };
  }
  const plan: DeliveryPlan<U> = { telegram: [], push: [], email: [] };
  for (const u of users) {
    if (channels.includes('telegram') && reachedElsewhere(u, ['telegram'])) plan.telegram.push(u);
    else if (channels.includes('push') && reachedElsewhere(u, ['push'])) plan.push.push(u);
    else if (channels.includes('email')) plan.email.push(u);
  }
  return plan;
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

/**
 * A recipient's string: in their own language when it is there — a body built
 * from the notices' JSON speaks all five (`subject`) — else as the templates
 * fall back (`recipientTemplateLang`), else English, else Hebrew.
 */
export function textFor(
  strings: Partial<Record<string, string | undefined>> | null | undefined,
  userLang: string | null | undefined
): string {
  if (!strings) return '';
  const own = userLang ? strings[userLang] : undefined;
  return own || strings[recipientTemplateLang(userLang)] || strings.en || strings.he || '';
}
