// ========================================
// --- WHY --- chrome only offers the "install app" prompt when the app
// has a registered service worker. without this the app lives in a
// browser tab and never gets a home screen / dock icon.
//
// the worker itself caches NOTHING (it has no fetch handler), so the
// app always shows fresh data. see frontend/sw.js for the whole story.
//
// --- WHY the url is absolute (`/sw.js`) and not relative ---
// the worker is served from the root of the site, so it gets the scope
// of `/` and controls every page, including the ones nested under
// /app/. a relative path would resolve against the current page's
// directory — from /app/contract/pumpopoly.html that would be
// /app/contract/sw.js, whose scope would cover only that folder, and
// the root pages would get no worker at all.
//
// --- WHY the guard --- serviceWorker only exists in a secure context
// (https, or http://localhost). the app is served over https through
// the cloudflare tunnel, but a plain-http LAN visit has no
// serviceWorker and would throw on the property access.
//
// --- WHY the catch --- registration fails when the browser is in a
// private window, or when the page is not a secure context. there is
// nothing to do about it and nothing to show the user, so the error
// is swallowed on purpose.
// ========================================
export function register_service_worker_fun(): void {
  if (typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
// ========================================
// copyright 2026 by sleet.near
