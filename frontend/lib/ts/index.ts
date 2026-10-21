// ========================================
// root landing-page script: after a 3s splash delay, sends the
// browser into app/index.html. SSR guard skips the timer outside
// the browser so this module stays importable from tests/scripts.
// ========================================

const REDIRECT_DELAY_MS = 3000;
const REDIRECT_TARGET = "./app/index.html";

if (typeof window !== "undefined") {
  window.setTimeout(() => {
    window.location.href = REDIRECT_TARGET;
  }, REDIRECT_DELAY_MS);
}
// ========================================
