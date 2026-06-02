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
self.addEventListener('push', ev => {
  const data = ev.data.json();
  console.log('Got push', data);
  const url = data.message?.url || 'https://www.1lev1.com/lev';
  console.log(url)
  ev.waitUntil(
    self.registration.showNotification(data.message.title, {
      body: data.message.body,
     
      //  registration_ids: [$('.header-user-name').find('span').text()],
      //ליצור בלינק פרמטר של אידי של הפוש ואז לעדכן כנקרא כשנלחץ
      icon:
        data.message.pic ??
        'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
        data: {
          url: url, 
          otherData: data.message.otherData // מידע נוסף שנרצה לשמור
      },
      actions: [
          { action: 'open_url', title: 'Open' }
      ]
    })
  );

});
self.addEventListener('notificationclick', function(event) {
  const url = event.notification.data.url;

  event.notification.close();

  event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
          // בדוק אם יש כבר חלון פתוח של האתר
          for (var i = 0; i < clientList.length; i++) {
              var client = clientList[i];
              if (client.url === url && 'focus' in client) {
                  return client.focus();
              }
          }
          // אם לא, פתח חלון חדש
          if (client.openWindow) {
              return client.openWindow(url);
          }
      }).then(() => {
          // דוגמה להפעלת פונקציה לשינוי בלוקל סטורג' או ביצוע fetch
          /*
          localStorage.setItem('notification_clicked', 'true');
          return fetch('/update', {
              method: 'POST',
              body: JSON.stringify({ clicked: true }),
              headers: { 'Content-Type': 'application/json' }
          });*/
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
