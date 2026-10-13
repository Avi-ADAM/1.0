// Telegram webhook authentication (PLAN_PROXY_SECURITY §14.6).
//
// An update names its own chat, and /api/newTelegram maps that chat to a member
// by `telegramId` and then acts as them (timers, `isSer` reads). Telegram proves
// an update is its own with the `X-Telegram-Bot-Api-Secret-Token` header — the
// `secret_token` given to setWebhook. We compare it to TELEGRAM_WEBHOOK_SECRET,
// in constant time.
//
// Transitional mode: while TELEGRAM_WEBHOOK_SECRET is unset the header is not
// checked at all (the behaviour before this file) and the first update of each
// process logs that. That lets setWebhook be re-run with `secret_token` before
// the env reaches every host, with no gap in which the bot answers 401. Once it
// is set, a missing or wrong header is 401 — there is no "header optional" mode,
// because a forger simply leaves it out.

import { env } from '$env/dynamic/private';
import { timingSafeEqual } from 'node:crypto';

export const TELEGRAM_SECRET_HEADER = 'x-telegram-bot-api-secret-token';

let warnedUnset = false;

/** @param {string} a @param {string} b */
function safeEqual(a, b) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * @param {string | null} given the X-Telegram-Bot-Api-Secret-Token header
 * @param {{ secret?: string }} [opts] `secret` is for tests
 * @returns {{ ok: boolean, enforced: boolean }}
 */
export function checkTelegramWebhook(given, { secret = env.TELEGRAM_WEBHOOK_SECRET || '' } = {}) {
	if (!secret) {
		if (!warnedUnset) {
			warnedUnset = true;
			console.warn(
				'[telegram] TELEGRAM_WEBHOOK_SECRET is not set — accepting updates without checking',
				'the secret header (transitional, §14.6). Header present on this update:',
				!!given
			);
		}
		return { ok: true, enforced: false };
	}
	return { ok: !!given && safeEqual(given, secret), enforced: true };
}
