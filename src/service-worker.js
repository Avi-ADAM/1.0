/// <reference types="@sveltejs/kit" />

//TODO: push nutifiction, english menifast
import { build, files, version } from '$service-worker';
import { signEventInSw, flushPending } from '$lib/crypto/swSign';

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
  ev.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
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
  );
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

self.addEventListener('fetch', (event) => {
  // ignore POST requests etc
  if (event.request.method !== 'GET') return;

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);

    // `build`/`files` can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      return cache.match(url.pathname);
    }

    // for everything else, try the network first, but
    // fall back to the cache if we're offline
    try {
      const response = await fetch(event.request);

      if (response.status === 200) {
        cache.put(event.request, response.clone());
      }

      return response;
    } catch {
      return cache.match(event.request);
    }
  }

  event.respondWith(respond());
});
