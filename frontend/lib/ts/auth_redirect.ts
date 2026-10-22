// ========================================
// auth.html redirect logic: bounce the browser to account.html
// when the user is signed in (whether on load or after a click).
// does NOT mount components — the host page loads import.ts for
// that.
// ========================================
import { HUGGIES_AUTH } from "./auth_status";
// ========================================
// ========================================
// ========================================
// --- HELPERS ----------------------------
// count directory levels below /app/ so a bare href can be
// prefixed with the right number of "../". mirrors nav.tsx and
// account_route.ts; three callers is enough to keep each inline.
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
// prepend "../" * depth to a bare href.
function resolve_href_fun(href: string, depth: number): string {
  if (depth <= 0) return href;
  return "../".repeat(depth) + href;
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
// --- REDIRECT ---------------------------
// replace-location to account.html when account_id is set.
// no-op when unsigned, so safe to call on every state change.
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
// self-run on import. init() is synchronous + idempotent, so
// safe to call alongside auth_button.tsx's own init.
if (typeof window !== "undefined") {
  HUGGIES_AUTH.init();
  redirect_if_signed_in_fun();
  // --- WHY --- the subscription is what catches the
  // "clicked LOGIN → wallet signed in → bounce" path. the
  // unsubscribe beforeunload cleanup prevents a leaked listener
  // in auth_status's array after navigation.
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
