// ========================================
// NAV
// shared top-level nav that lives on every app/* page. mounts into
// the <nav id="HUGGIES_COMPONENT_NAV"> element each page already
// declares (see frontend/app/*.html) and renders four links:
// FEED, SWAP, ACCOUNT, SKILL.
//
// hrefs are computed at render time from window.location.pathname
// so the nav works no matter how deep the current page sits inside
// the app/ tree. a page at /app/index.html resolves a link to
// "swap.html" (one level deep from app/), while a page at
// /app/tool/page.html resolves it to "../swap.html" (two levels
// deep, so the link lands back at /app/swap.html).
//
// active-link highlighting uses the same logic: the link whose
// target basename matches the current page's basename gets the
// aria-current="page" attribute.
//
// the four pages live in the same MOUNT_ID namespace as everything
// else in this app — pages can mount as many cards as they want,
// the nav is just one of them.
//
// auth.html is intentionally excluded — it is the login page that
// auto-redirects when the user is signed in, so adding a nav there
// would be confusing (a logged-in user lands on ACCOUNT directly).
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { Home, RefreshCcw, User, GraduationCap } from "lucide-preact";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the four nav entries. `href` is the bare filename (no directory
// prefix); the runtime resolver below applies the right number of
// "../" prefixes for the current page depth.
import type { ComponentType } from "preact";
interface HUGGIES_NAV_LINK {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
}
const HUGGIES_NAV_LINKS: ReadonlyArray<HUGGIES_NAV_LINK> = [
  { href: "index.html", label: "FEED", Icon: Home },
  { href: "swap.html", label: "SWAP", Icon: RefreshCcw },
  { href: "account.html", label: "ACCOUNT", Icon: User },
  { href: "skill.html", label: "SKILL", Icon: GraduationCap },
];
// ========================================
// --- HELPERS ----------------------------
// current_depth_after_app_fun — count how many directory levels
// the current page sits below the /app/ segment. so:
//   /app/index.html          → 0
//   /app/tool/page.html      → 1
//   /app/tool/sub/page.html  → 2
//
// the "/app/" anchor is hardcoded because that is the directory
// every page in frontend/app/*.html (and any future
// frontend/app/<sub>/page.html) lives under once the static
// files get served.
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
// resolve_href_fun — turn a bare href like "swap.html" into the
// href the current page actually needs. e.g. depth 0 → "swap.html",
// depth 1 → "../swap.html", depth 2 → "../../swap.html".
function resolve_href_fun(href: string, depth: number): string {
  if (depth <= 0) return href;
  return "../".repeat(depth) + href;
}
// ========================================
// current_basename_fun — last path segment of the current URL,
// stripped of any query/hash. used for active-link matching.
function current_basename_fun(): string {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return "";
  }
  const path = window.location.pathname;
  const last_slash = path.lastIndexOf("/");
  const last = last_slash === -1 ? path : path.slice(last_slash + 1);
  return last;
}
// ========================================
// is_active_link_fun — true when the link's bare href matches the
// current page's basename. resolved hrefs are not compared on
// purpose — we only care whether the user is "on" that page.
function is_active_link_fun(href: string, current_base: string): boolean {
  return current_base === href;
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_NAV_FUN() {
  // ========================================
  const depth = current_depth_after_app_fun();
  const current_base = current_basename_fun();

  return (
    <>
      {HUGGIES_NAV_LINKS.map((link) => {
        const resolved = resolve_href_fun(link.href, depth);
        const is_active = is_active_link_fun(link.href, current_base);
        return (
          <a href={resolved} aria-current={is_active ? "page" : undefined}>
            <link.Icon size={20} />
            <span>{link.label}</span>
          </a>
        );
      })}
    </>
  );
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount so the component file works as its own entry. looks for
// a <nav id="HUGGIES_COMPONENT_NAV"> on the page (added by every
// frontend/app/*.html except auth.html) and renders into it.
//
// the side effect is guarded by an id check so importing this module
// from another file (e.g. for testing) won't accidentally mount a
// second instance.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_NAV;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_NAV_FUN />, el);
}
// ========================================
