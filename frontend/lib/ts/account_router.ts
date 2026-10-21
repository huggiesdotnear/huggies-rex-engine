// ========================================
// ACCOUNT ROUTER
// the tiny redirect shim that sits at frontend/app/account-router.html
// and is also what the top-level nav points at for the PROFILE entry.
// this page never stays on screen — the moment it loads it inspects
// auth state and bounces the browser to the right next page:
//
//   signed in              → account.html?id=<account_id>
//   signed out             → auth.html
//
// WHY A ROUTER INSTEAD OF A DIRECT LINK: account.html is only useful
// when a session exists; landing a logged-out user on it produces a
// blank page (it is keyed off the ?id= query string and has nothing
// to render otherwise). auth.html is the login flow. rather than
// make the nav pick between them, the router does the pick in one
// place — so the PROFILE nav entry is correct regardless of who
// clicks it.
//
// WHY A TS MODULE, NOT INLINE JS: the redirect logic is non-trivial
// (init auth state, read account_id, build the right URL, swap the
// location). an inline <script> in the html would re-implement it
// and lose the comments; a module keeps the reasoning next to the
// code, and an SSR `typeof window` guard keeps it importable from
// non-browser contexts (tests, future node scripts) without
// throwing on window.location.
//
// LOADED THROUGH IMPORT.TS
// ------------------------
// like auth_redirect.ts, this module is pulled in as a side
// effect of every app/* page's import.ts (see
// frontend/lib/ts/import.ts). account-router.html mounts no
// components, so the few extra module loads it picks up are
// no-ops — uniformity of the "every page loads import.ts"
// convention is worth more than the skipped work.
// ========================================
import { HUGGIES_AUTH } from "./auth_status";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// current_depth_after_app_fun — duplicate of the helper in
// nav.tsx. it lives here too rather than being shared because the
// nav and this router are the only two callers, and pulling a
// "current depth" helper out of either would muddle its single
// responsibility. if a third caller ever appears this should be
// promoted to its own module; two callers in two files is fine.
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
// resolve_href_fun — turn a bare href like "auth.html" into the
// href the current page actually needs. e.g. depth 0 →
// "auth.html", depth 1 → "../auth.html", depth 2 →
// "../../auth.html". mirrors resolve_href_fun in nav.tsx.
function resolve_href_fun(href: string, depth: number): string {
  if (depth <= 0) return href;
  return "../".repeat(depth) + href;
}
// ========================================
// build_login_href_fun — the URL we bounce a signed-out user to
// (auth.html, at the right relative depth for the current page).
//
// kept separate from build_account_href_fun because the two
// queries differ — account.html needs ?id=<account_id> and a
// query string has to be URL-encoded, while auth.html is a bare
// href.
function build_login_href_fun(): string {
  return resolve_href_fun("auth.html", current_depth_after_app_fun());
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
// --- ROUTE ------------------------------
// route_fun — inspect auth state and swap the browser to the
// right next page. never returns — the redirect either moves the
// browser (so the script is unloaded mid-flight) or, in the SSR
// guard path, no-ops entirely.
//
// the order matters: HUGGIES_AUTH.init() must run BEFORE the
// account_id read, because init is what rehydrates account_id
// from our own localStorage. without it, an unauthenticated
// fresh page-load would always report "not signed in" even when
// a valid session sits in storage. init() is synchronous and
// safe to call from a script tag — it reads from localStorage
// directly and only attaches wallet listeners.
//
// why read off HUGGIES_AUTH rather than load_session_fun()
// directly: HUGGIES_AUTH is the public surface components
// render from, and reading from it here means any future change
// to "what counts as signed in" (e.g. adding expiry, server-
// side verification) only has to be made in one place.
function route_fun(): void {
  if (typeof window === "undefined") return;
  HUGGIES_AUTH.init();
  const account_id = HUGGIES_AUTH.get_account_id();
  if (account_id === null) {
    window.location.replace(build_login_href_fun());
    return;
  }
  window.location.replace(build_account_href_fun(account_id));
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- RUN --------------------------------
// kick the redirect as a side effect of import. self-runs because
// this file is wired in through import.ts (the same bundle every
// app/* page loads), and the page has nothing else to do while
// the redirect happens, so wrapping this in a function someone
// has to call would only invite a page author to forget the call.
//
// location.replace (vs assign) keeps the router page out of the
// browser's history, so the back button does not bounce back to a
// page that immediately bounces forward again — that's the same
// trick the root landing page already uses (see index.ts).
route_fun();
// ========================================
// copyright 2026 by sleet.near
// ========================================
