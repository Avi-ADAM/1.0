/// <reference types="@sveltejs/kit" />

//TODO: push nutifiction, english menifast
import { build, files, version } from '$service-worker';
import { signEventInSw, flushPending } from '$lib/crypto/swSign';
import { cosignInSw } from '$lib/crypto/swCosign';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
  ...build, // the app itself
  ...files // everything in `static`
];

self.addEventListener('install', (event) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }

  event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }

  event.waitUntil(deleteOldCaches());
});
// A path on the site resolves against this worker's own origin, so the same
// notification opens the right host in dev, preview and production.
const siteUrl = (u) => {
  try {
    return new URL(u || '/lev', self.location.origin).href;
  } catch {
    return new URL('/lev', self.location.origin).href;
  }
};

self.addEventListener('push', ev => {
  const data = ev.data.json();
  const message = data.message || {};
  const url = siteUrl(message.url);
  // One button per place to answer it (the rikma's vote page, the heart) — the
  // reader picks; a tap on the notification itself opens the first.
  const links = (Array.isArray(message.actions) ? message.actions : [])
    .filter((a) => a && a.action && a.title && a.url)
    .slice(0, 2);
  const urls = Object.fromEntries(links.map((a) => [a.action, siteUrl(a.url)]));
  // A tick made through Telegram / MCP / the assistant: this device co-signs it
  // ($lib/consent/cosign) and the notification says whether it did.
  const cosigned = message.cosign
    ? cosignInSw(message.cosign).catch((e) => ({ ok: false, reason: 'threw:' + (e && e.message) }))
    : Promise.resolve(null);
  ev.waitUntil(cosigned.then((res) =>
    self.registration.showNotification(message.title, {
      body: res && res.ok && message.bodySigned ? message.bodySigned : message.body,
      icon:
        message.pic ??
        'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
      data: {
        url,
        urls,
        otherData: message.otherData // מידע נוסף שנרצה לשמור
      },
      actions: links.length
        ? links.map((a) => ({ action: a.action, title: a.title }))
        : [{ action: 'open_url', title: 'Open' }]
    })
  ));
});

self.addEventListener('notificationclick', function (event) {
  const data = event.notification.data || {};
  const url = (event.action && data.urls && data.urls[event.action]) || data.url || siteUrl('/lev');

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // A tab already on that page: bring it forward.
      const same = clientList.find((c) => c.url === url && 'focus' in c);
      if (same) return same.focus();
      // Otherwise a new one — never by navigating a tab the member is using
      // (a draft there would be lost). This is the global `clients`: a
      // WindowClient has no openWindow, so a tap used to open nothing.
      return clients.openWindow(url);
    })
  );
});

// Consent signing: a single-writer endpoint that signs an event with the
// non-extractable private key kept in the freemates-crypto IDB. UI tabs pass
// MessageChannel ports so the reply is delivered back to the originator.
self.addEventListener('message', (ev) => {
  const data = ev.data;
  if (!data || data.type !== 'consent.sign') return;
  const port = ev.ports && ev.ports[0];
  ev.waitUntil((async () => {
    try {
      const res = await signEventInSw(data.payload);
      if (port) port.postMessage(res);
      if (res.ok && self.registration && self.registration.sync) {
        try { await self.registration.sync.register('consent-sync'); } catch (e) { void e; }
      }
    } catch (e) {
      if (port) port.postMessage({ ok: false, reason: 'sw_threw: ' + (e && e.message) });
    }
  })());
});

self.addEventListener('sync', (ev) => {
  if (ev.tag === 'consent-sync') ev.waitUntil(flushPending());
});

// What a navigation gets when the network failed and nothing was cached. It is
// the worker's own page, so it cannot use $t(); two lines cover the default
// locale and everyone else.
function offlinePage() {
  const html =
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>1lev1</title></head>' +
    '<body style="font-family:system-ui,sans-serif;text-align:center;padding:3rem 1rem">' +
    '<p dir="rtl">אין חיבור לרשת כרגע.</p>' +
    '<p dir="ltr">You seem to be offline.</p>' +
    '<p><button onclick="location.reload()">↻</button></p>' +
    '</body></html>';
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // ignore POST requests etc
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Another origin (Strapi, Cloudinary, the socket server…) or a non-http
  // scheme (chrome-extension:) is the browser's to fetch: Cache.put rejects a
  // non-http request, and we have nothing to fall back to for it anyway.
  if (url.origin !== self.location.origin) return;

  // `respondWith` must always get a Response. `cache.match` resolves to
  // `undefined` on a miss, and handing that over is "Failed to convert value to
  // 'Response'" plus a network error for the whole navigation — so every path
  // below ends in the network, the cache, or an explicit fallback.
  async function fromNetwork(cache) {
    const response = await fetch(request);
    if (response.status === 200 && cache) {
      // Fire-and-forget, but never an unhandled rejection (quota, a body
      // already used, a response the cache will not store).
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  }

  async function respond() {
    let cache = null;
    try {
      cache = await caches.open(CACHE);
    } catch {
      // No cache storage (private mode, eviction): plain network.
    }

    // `build`/`files` can always be served from the cache
    if (cache && ASSETS.includes(url.pathname)) {
      const hit = await cache.match(url.pathname).catch(() => undefined);
      if (hit) return hit;
    }

    // for everything else, try the network first, but
    // fall back to the cache if we're offline
    try {
      return await fromNetwork(cache);
    } catch {
      const hit = cache ? await cache.match(request).catch(() => undefined) : undefined;
      if (hit) return hit;
      if (request.mode === 'navigate') return offlinePage();
      return Response.error();
    }
  }

  event.respondWith(respond());
});
