let CACHE_NAME = "cache-" + Date.now();

self.addEventListener("install", event => {
    console.log("Installed SW");
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.add("/offline.html");
        })
  );
self.skipWaiting();
});


self.addEventListener("activate", (event) => {
    console.log("Activated SW");
});

self.addEventListener("fetch", (event) => {
    console.log("Fetch:", event.request);
});