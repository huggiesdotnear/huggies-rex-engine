// ========================================
// root splash-page script: after a 1.5s delay, sends the browser
// into app/index.html (the FEED). SSR guard skips the timer outside
// the browser so this module stays importable from tests/scripts.
// ========================================

const REDIRECT_DELAY_MS = 1500;
const REDIRECT_TARGET = "./app/index.html";

if (typeof window !== "undefined") {
  window.setTimeout(() => {
    window.location.href = REDIRECT_TARGET;
  }, REDIRECT_DELAY_MS);
}
// ========================================
