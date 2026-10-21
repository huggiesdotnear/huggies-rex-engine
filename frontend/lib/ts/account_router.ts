// ========================================
// redirect shim for /app/account-router.html. signed-in users
// → account.html?id=<id>, signed-out → auth.html. does NOT mount
// components — the host page loads import.ts for that.
// ========================================
import { HUGGIES_AUTH } from "./auth_status";
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
// ========================================
// ========================================
// --- ROUTE ------------------------------
// inspect auth state and replace-location to the right page.
// --- WHY --- init() must run BEFORE get_account_id(): init is what
// rehydrates account_id from localStorage, so without it a fresh
// page load always looks signed out even when a session sits in
// storage.
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
// self-run on import. replace (vs assign) keeps the router out
// of history, so back doesn't bounce into a page that immediately
// bounces forward — same trick as index.ts.
route_fun();
// ========================================
// copyright 2026 by sleet.near
// ========================================
