// ========================================
// root splash-page script: after a 1.5s delay, sends the browser
// into app/index.html (the FEED). SSR guard skips the timer outside
// the browser so this module stays importable from tests/scripts.
//
// --- WHY --- replace (not assign to .href): the splash page must not
// stay in browser history, or the back button lands on it and it
// bounces forward again. same trick as app_page_account_route.ts.
const REDIRECT_DELAY_MS = 1500;
const REDIRECT_TARGET = "./app/index.html";
// ========================================
if (typeof window !== "undefined") {
  window.setTimeout(() => {
    window.location.replace(REDIRECT_TARGET);
  }, REDIRECT_DELAY_MS);
}
// ========================================
