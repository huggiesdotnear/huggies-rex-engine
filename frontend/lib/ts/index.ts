// ========================================
// INDEX
// tiny landing-page script wired into the root frontend/index.html.
// waits three seconds then redirects the browser into the actual
// app at app/index.html. lives in lib/ts (instead of inline in the
// html) so the timer / target live in one place and any future
// landing-page logic can land in the same file.
//
// the 3000ms delay gives the HUGGIES splash on the root page a
// chance to register visually before the swap. SSR guard skips the
// setTimeout when this module is imported from non-browser
// contexts (tests, future node scripts) so window is safe.
// ========================================

const REDIRECT_DELAY_MS = 3000;
const REDIRECT_TARGET = "./app/index.html";

if (typeof window !== "undefined") {
  window.setTimeout(() => {
    window.location.href = REDIRECT_TARGET;
  }, REDIRECT_DELAY_MS);
}
// ========================================
