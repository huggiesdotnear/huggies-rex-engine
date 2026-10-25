// ========================================
// top-level nav on every app/* page (except the two redirect
// pages, which never stay on screen long enough to host a nav).
// mounts into <nav id="HUGGIES_COMPONENT_NAV">; hrefs are
// resolved at render time so a nav on a nested page still
// points back at the bare filenames under /app/.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { Home, LayoutGrid, User, GraduationCap } from "lucide-preact";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// `href` is a bare filename; resolve_href_fun prefixes ../.
import type { ComponentType } from "preact";
interface HUGGIES_NAV_LINK {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
}
// PROFILE points at the router, not account.html directly, so a
// logged-out user lands on auth.html instead of a blank
// account.html with no ?id= to read.
const HUGGIES_NAV_LINKS: ReadonlyArray<HUGGIES_NAV_LINK> = [
  { href: "index.html", label: "FEED", Icon: Home },
  { href: "discover.html", label: "DISCOVER", Icon: LayoutGrid },
  { href: "account.html", label: "PROFILE", Icon: User },
  { href: "skill.html", label: "SKILL", Icon: GraduationCap },
];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// count directory levels below /app/ for href prefixing.
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
// last path segment of the current URL, for active-link matching.
function current_basename_fun(): string {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return "";
  }
  const path = window.location.pathname;
  const last_slash = path.lastIndexOf("/");
  return last_slash === -1 ? path : path.slice(last_slash + 1);
}
// ========================================
// "is this link the current page" — match on bare href, not resolved.
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
// self-mount guarded by id check so re-imports don't double-render.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_NAV;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_NAV_FUN />, el);
}
// ========================================
