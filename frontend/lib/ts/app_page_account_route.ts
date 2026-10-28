// ========================================
// account.html fallback routing: the page has no `?id=` of its own, so
// decide what it is showing. signed in → rewrite the url to
// account.html?id=<id>, signed out → auth.html. does NOT mount
// components — the host page loads import.ts for that.
// ========================================
import { HUGGIES_AUTH } from "./auth_status";
import { HUGGIES_URL_ID } from "./url_id";
// ========================================
// ========================================
// ========================================
// --- HELPERS ----------------------------
// count directory levels below /app/ so a bare href like
// "auth.html" can be prefixed with the right number of "../".
function current_depth_after_app_fun(): number {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return 0;
  }
  const path = window.location.pathname;
  const APP_ANCHOR = "/app/";
  const idx = path.lastIndexOf(APP_ANCHOR);
  if (idx === -1) return 0;
  const after_app = path.slice(idx + APP_ANCHOR.length);
  const last_slash = after_app.lastIndexOf("/");
  const dir_part = last_slash === -1 ? "" : after_app.slice(0, last_slash);
  if (dir_part.length === 0) return 0;
  return dir_part.split("/").filter((s) => s.length > 0).length;
}
// ========================================
// prepend "../" * depth to a bare href. mirrors nav.tsx.
function resolve_href_fun(href: string, depth: number): string {
  if (depth <= 0) return href;
  return "../".repeat(depth) + href;
}
// ========================================
// URL we bounce a signed-out user to.
function build_login_href_fun(): string {
  return resolve_href_fun("auth.html", current_depth_after_app_fun());
}
// ========================================
// URL we bounce a signed-in user to. encodeURIComponent is safe
// for NEAR ids; the only realistic special char is ".".
function build_account_href_fun(account_id: string): string {
  const base = resolve_href_fun("account.html", current_depth_after_app_fun());
  return `${base}?id=${encodeURIComponent(account_id)}`;
}
// ========================================
// the page's own `?id=`, or null when absent/blank. read here rather
// than through HUGGIES_APP_PAGE_ACCOUNT_ID because that module's state is
// populated by components which run AFTER this routing decision.
//
// --- WHY --- the shared lib/ts/url_id.ts does the reading: the trim
// and the blank-means-absent rule live there, so the routing decision
// and the page's own id cannot drift apart.
function read_url_account_id_fun(): string | null {
  return HUGGIES_URL_ID.read();
}
// ========================================
// ========================================
// ========================================
// --- ROUTE ------------------------------
// --- WHY --- init() must run BEFORE get_account_id(): init is what
// rehydrates account_id from localStorage, so without it a fresh
// page load always looks signed out even when a session sits in
// storage.
// --- WHY --- replace (vs assign) keeps this out of history, so back
// from account.html doesn't land on the bare page that immediately
// bounces forward again — same trick as index.ts.
// --- WHY --- a real `?id=` always wins, signed in or not, so shared
// profile links stay viewable by guests. only the bare page routes.
function route_fun(): void {
  if (typeof window === "undefined") return;
  if (read_url_account_id_fun() !== null) return;
  HUGGIES_AUTH.init();
  const account_id = HUGGIES_AUTH.get_account_id();
  const target =
    account_id === null
      ? build_login_href_fun()
      : build_account_href_fun(account_id);
  window.location.replace(target);
}
// ========================================
// ========================================
// ========================================
// --- RUN --------------------------------
// self-run on import.
route_fun();
// ========================================
// copyright 2026 by sleet.near
// ========================================
