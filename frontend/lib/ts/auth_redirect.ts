// ========================================
// AUTH REDIRECT
// the auto-redirect logic for frontend/app/auth.html. the page
// itself just declares an empty <main> + the network and auth
// buttons; this module does the actual bouncing.
//
// TWO FLIPS, ONE SUBSCRIPTION
// ---------------------------
// auth.html needs to redirect in both directions:
//
//   already signed in on load → bounce to account.html?id=<id>
//                               (the user already has a session,
//                               there is nothing to log in to)
//
//   unsigned on load → button click → sign-in completes in the
//                      wallet popup → bounce to the same place
//
// the right tool for detecting both is HUGGIES_AUTH.subscribe().
// polling every few seconds would:
//   - add up-to-N seconds of latency after a successful sign-in
//   - wake the tab on a timer for no reason when nothing changed
//   - miss the moment state actually flipped, giving a sluggish
//     feel
//   - need teardown so the timer does not fire on a page that has
//     already navigated away
// subscription lights up the instant auth_status.ts calls
// notify_fun() — which happens right after account_id is set in
// sign_in_fun(), and again on wallet:signIn from autoConnect on
// load. zero polling, zero latency, zero missed events.
//
// WHY THIS LIVES IN ITS OWN MODULE, NOT INLINE IN auth.html
// ---------------------------------------------------------
// the subscriber needs to run before any user click, which means
// it has to import HUGGIES_AUTH. putting it inline in the html
// would mean a <script type="module"> tag and re-deriving the
// redirect URL on every edit. a module keeps the reasoning (and
// the depth-aware URL builder) next to the code, mirroring the
// shape of account_router.ts so the two redirect pages read
// the same way.
// ========================================
import { HUGGIES_AUTH } from "./auth_status";
// side-effect imports — pulling in the two components auth.html
// renders (network toggle + LOGIN button) so a single
// <script src=".../auth_redirect.ts"> tag in auth.html is
// enough to get the working UI. account_router.ts does not
// reuse this trick because account-router.html intentionally
// has no UI of its own (it redirects immediately on load).
import "../components/auth_button";
import "../components/network_button";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// current_depth_after_app_fun — same helper used in
// account_router.ts and nav.tsx. it lives in each file rather
// than being shared because there are only two callers, and
// pulling a "current depth" helper out of either would muddle
// its single responsibility. if a third caller ever appears
// this should be promoted to its own module; two callers in two
// files is fine.
//
// counts how many directory levels the current page sits below
// the /app/ segment:
//   /app/index.html          → 0
//   /app/tool/page.html      → 1
//   /app/tool/sub/page.html  → 2
//
// SSR guard returns 0 so this module stays importable from
// non-browser contexts (tests, future node scripts) without
// throwing on window.location.
function current_depth_after_app_fun(): number {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return 0;
  }
  const path = window.location.pathname;
  const APP_ANCHOR = "/app/";
  const idx = path.lastIndexOf(APP_ANCHOR);
  if (idx === -1) {
    // page is outside /app/ entirely — link relative to root by
    // returning 0; the hrefs themselves still work via
    // window.location.origin fallback below.
    return 0;
  }
  const after_app = path.slice(idx + APP_ANCHOR.length);
  // strip the filename; only the directory slashes count toward depth.
  const last_slash = after_app.lastIndexOf("/");
  const dir_part = last_slash === -1 ? "" : after_app.slice(0, last_slash);
  if (dir_part.length === 0) return 0;
  // one "../" per directory level under /app/.
  return dir_part.split("/").filter((s) => s.length > 0).length;
}
// ========================================
// resolve_href_fun — turn a bare href into the href the current
// page actually needs. depth 0 → "auth.html", depth 1 →
// "../auth.html", depth 2 → "../../auth.html". mirrors
// resolve_href_fun in nav.tsx and account_router.ts.
function resolve_href_fun(href: string, depth: number): string {
  if (depth <= 0) return href;
  return "../".repeat(depth) + href;
}
// ========================================
// build_account_href_fun — the URL we bounce a signed-in user to.
// account.html reads ?id=<account_id> and renders that account's
// profile. encodeURIComponent handles NEAR ids safely even though
// the only "special" character they can contain in practice is
// "."
//
// account_id is non-null by construction — the caller has already
// checked HUGGIES_AUTH.is_signed_in() and HUGGIES_AUTH.get_account_id()
// before reaching here — but the type system does not know that,
// so the null branch returns auth.html rather than crashing or
// building a "?id=null" string that account.html would later fail
// to render.
function build_account_href_fun(account_id: string): string {
  const base = resolve_href_fun("account.html", current_depth_after_app_fun());
  return `${base}?id=${encodeURIComponent(account_id)}`;
}
// ========================================
// ========================================
// ========================================
// --- REDIRECT ---------------------------
// redirect_if_signed_in_fun — swap the browser to account.html
// when account_id is set. a no-op when nobody is signed in, so
// the caller can invoke it on every state change without
// checking first.
//
// location.replace (vs assign) keeps auth.html out of the
// browser's history, so the back button does not bounce back to
// a page that immediately bounces forward again — that's the
// same trick the root landing page (index.ts) and
// account_router.ts already use.
function redirect_if_signed_in_fun(): void {
  if (typeof window === "undefined") return;
  const account_id = HUGGIES_AUTH.get_account_id();
  if (account_id === null) return;
  window.location.replace(build_account_href_fun(account_id));
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- RUN --------------------------------
// kick the redirect as a side effect of import. self-runs because
// this file is its own entry, loaded directly from auth.html's
// <script src="../lib/ts/auth_redirect.ts"> tag.
//
// init() must run first so the stored-session rehydration is in
// place before either redirect branch reads account_id. it is
// synchronous (it reads localStorage directly) and idempotent
// across modules — auth_button.tsx also calls init(), and a
// second call just re-attaches listeners on an already-initialised
// store. safe to call twice.
//
// the subscription is the actual feature: any future sign-in
// completion, wallet reconnect, or autoConnect adoption will
// notify_fun() in auth_status.ts, the listener fires, and we
// bounce the browser. the listener itself returns the
// unsubscribe function from HUGGIES_AUTH, which we hold in a
// module-level variable so beforeunload can clean it up —
// without that, a redirect would leave the listener registered
// in auth_status's array, harmless today but a leak waiting to
// happen once tabs stop throwing the whole process away on
// navigation.
if (typeof window !== "undefined") {
  HUGGIES_AUTH.init();
  // pass 1: already signed in on load → bounce immediately.
  // subscribe() would also catch this on its first call, but
  // bouncing up-front skips the empty-paint frame auth.html
  // flashes while the import graph settles.
  redirect_if_signed_in_fun();
  // pass 2: subscribe for the "signed in later" case (the user
  // clicks LOGIN → wallet signs → notify_fun fires → we
  // bounce). unsubscribe on unload so the listener does not
  // outlive the page.
  const unsubscribe = HUGGIES_AUTH.subscribe(() => {
    redirect_if_signed_in_fun();
  });
  window.addEventListener("beforeunload", () => {
    unsubscribe();
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
