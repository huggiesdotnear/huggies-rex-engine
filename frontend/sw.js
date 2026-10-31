// ========================================
// HUGGIES SERVICE WORKER
//
// the app is NOT offline-capable and does NOT want to be. every request
// goes to the network, always. this worker exists for exactly two
// reasons:
//
//   1. INSTALLABILITY. chrome wants a registered service worker before
//      it offers the "install app" prompt. without one the app can only
//      live in a browser tab, not on the home screen / dock.
//
//   2. PROMPT DEPLOYMENTS. `skipWaiting` + `clients.claim` make a new
//      build take over the open tabs right away, instead of waiting for
//      every tab to be closed.
//
// --- WHY there is NO `fetch` handler ---
// a service worker without a fetch handler is a pass-through: the
// browser asks the network for everything, exactly as if the worker
// were not there. that is what we want — the app must always show
// FRESH data, and the backend already sends `cache-control: no-cache,
// must-revalidate` on every static file. adding a fetch handler here
// would mean deciding what to cache and when to revalidate, and every
// one of those decisions is a chance to serve stale token prices.
//
// --- WHY this file is plain and import-free ---
// bun builds this file as its own entry point. a file with imports
// would be bundled and wrapped in a CommonJS interop shim
// (`export default s()`), which is a SyntaxError in a classic service
// worker and kills it silently. keeping this file free of imports is
// what makes bun emit it verbatim. the repo's root package.json also
// has "type": "module", which is what keeps bun treating this file as
// ESM in the first place — do not remove that field.
//
// --- WHY the scope is the whole app ---
// this file is served from /sw.js, and a worker gets the scope of the
// directory it was served from, so it controls / — every page under
// /app/ included. do not move it into a subfolder: it would lose
// control over the pages next to it.
// ========================================

self.addEventListener("install", () => {
  // take over as soon as the new worker is ready, even if an old tab
  // is still open.
  self.skipWaiting();
});

// ========================================
self.addEventListener("activate", (event) => {
  // claim the pages that are already open, so the user does not have
  // to reload to get the new build.
  event.waitUntil(self.clients.claim());
});
// ========================================
// copyright 2026 by sleet.near
