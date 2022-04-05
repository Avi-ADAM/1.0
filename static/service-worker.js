console.log("*****hello from testserviceworker.js inside static folder********")

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('v3').then((cache) => {
            cache.add(
                './favicon.ico'
            );
        })
    );
});

self.addEventListener('activate', function (event) {
    console.log("serviceworker activate fn :", event)
});

self.addEventListener('fetch', function (event) {
    console.log("fetch fn inside serviceworker.js")
})