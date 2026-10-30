// Server half of device co-signing ($lib/consent/cosign): after a timer action
// that came through Telegram, the MCP connector or the in-app assistant, ask
// the member's devices to sign it. The ask is a web push — the member sees
// that their clock moved and from where, and the service worker signs.
//
// Only rikmas on the Space (SPACE_SYNC_PROJECTS, A1) are asked: elsewhere a
// signed tick would have no log to land in. Best effort — never throws, and a
// device that does not answer only leaves the gap that existed before.

import { env } from '$env/dynamic/private';
import { sendToSer } from '$lib/send/sendToSer.js';
import { parseSpaceSyncProjects } from '$lib/space/syncFlag';
import {
  buildCosignRequests,
  COSIGN_ACTION_KEYS,
  COSIGN_MAX_SKEW_MS,
  type CosignRequest,
  type CosignVia
} from '$lib/consent/cosign';
import { textFor } from '$lib/server/notifications/intent';

type Fetch = typeof fetch;

// Indexed by the RECIPIENT's language — $t() cannot reach a push payload.
const TITLE: Record<'start' | 'stop', Record<string, string>> = {
  start: {
    he: 'הטיימר הופעל',
    en: 'Your timer started',
    ar: 'بدأ المؤقت',
    ru: 'Таймер запущен',
    es: 'Tu temporizador empezó'
  },
  stop: {
    he: 'הטיימר נעצר',
    en: 'Your timer stopped',
    ar: 'توقف المؤقت',
    ru: 'Таймер остановлен',
    es: 'Tu temporizador se detuvo'
  }
};

const CHANNEL: Record<CosignVia, Record<string, string>> = {
  telegram: {
    he: 'דרך טלגרם.',
    en: 'From Telegram.',
    ar: 'عبر تيليغرام.',
    ru: 'Через Telegram.',
    es: 'Desde Telegram.'
  },
  mcp: {
    he: 'דרך מפתח MCP.',
    en: 'Through an MCP key.',
    ar: 'عبر مفتاح MCP.',
    ru: 'Через ключ MCP.',
    es: 'Con una clave MCP.'
  },
  assistant: {
    he: 'דרך העוזר באתר.',
    en: 'Through the assistant.',
    ar: 'عبر المساعد.',
    ru: 'Через ассистента.',
    es: 'Con el asistente.'
  }
};

// Appended only by a device that did sign — the service worker picks.
const SIGNED: Record<string, string> = {
  he: 'המכשיר הזה חתם על כך בשמך.',
  en: 'This device signed it for you.',
  ar: 'وقّع هذا الجهاز عليه باسمك.',
  ru: 'Это устройство подписало его за вас.',
  es: 'Este dispositivo lo firmó por ti.'
};

const NOT_ME: Record<string, string> = {
  he: 'לא אני',
  en: 'Not me',
  ar: 'لست أنا',
  ru: 'Это не я',
  es: 'No fui yo'
};

/** Where "not me" leads: the place that can take the channel's access away. */
const NOT_ME_URL: Record<CosignVia, string> = {
  telegram: '/me/settings',
  mcp: '/me/settings/mcp',
  assistant: '/me/settings/mcp'
};

type Device = { id?: string | number; attributes?: { jsoni?: string } };

/** The push message for one request — `cosign` is what the service worker signs. */
export function cosignPushMessage(req: CosignRequest, lang: string) {
  const channel = textFor(CHANNEL[req.via], lang);
  return {
    url: '/lev',
    title: textFor(TITLE[req.params.op], lang),
    // What the member reads when this device could not sign (no key, stale).
    body: channel,
    bodySigned: `${channel} ${textFor(SIGNED, lang)}`,
    actions: [{ action: 'notme', title: textFor(NOT_ME, lang), url: NOT_ME_URL[req.via] }],
    cosign: req
  };
}

export async function requestDeviceCosign(opts: {
  actionKey: string;
  params: Record<string, unknown>;
  result: unknown;
  userId: string;
  via: CosignVia;
  fetch: Fetch;
  /** Injected in tests; the env list otherwise. */
  spaceProjects?: readonly string[];
}): Promise<{ asked: number; devices: number }> {
  const none = { asked: 0, devices: 0 };
  if (!COSIGN_ACTION_KEYS.has(opts.actionKey)) return none;
  try {
    const onSpace = opts.spaceProjects ?? parseSpaceSyncProjects(env.SPACE_SYNC_PROJECTS);
    const requests = buildCosignRequests(opts.actionKey, opts.params, opts.result, {
      userId: opts.userId,
      via: opts.via
    }).filter((r) => onSpace.includes(r.projectId));
    if (requests.length === 0) return none;

    const res: any = await sendToSer({ uid: opts.userId }, '24userJSONQue', 0, 0, true, opts.fetch);
    const user = res?.data?.usersPermissionsUser?.data?.attributes;
    const devices: Device[] = (user?.machshirs?.data ?? []).filter((d: Device) => d?.attributes?.jsoni);
    if (devices.length === 0) return { asked: requests.length, devices: 0 };
    const lang = user?.lang || 'he';

    const sends: Promise<unknown>[] = [];
    for (const req of requests) {
      const messege = cosignPushMessage(req, lang);
      for (const d of devices) {
        sends.push(
          opts.fetch('/api/pusher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsoni: d.attributes!.jsoni,
              machshirId: d.id,
              messege,
              // A late push is shown but no longer signed — no reason to hold it.
              ttl: Math.floor(COSIGN_MAX_SKEW_MS / 1000)
            })
          })
        );
      }
    }
    await Promise.allSettled(sends);
    return { asked: requests.length, devices: devices.length };
  } catch (e) {
    console.warn('[device-cosign] request failed', (e as Error)?.message);
    return none;
  }
}
