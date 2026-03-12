// public/service-worker.js

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  self.registration.showNotification("KBetz™ Alert", {
    body: data.message || "Hedge opportunity detected",
    icon: "/icon.png",
    badge: "/icon.png",
    vibrate: [200, 100, 200],
  });
});
