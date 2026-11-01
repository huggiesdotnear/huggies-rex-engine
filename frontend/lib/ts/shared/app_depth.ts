// ========================================
// how many directory levels deep the current page sits below /app/.
// --- WHY --- a link from a nested page (app/contract/rhea.html) back
// to a page directly under /app/ (app/account.html) needs one "../"
// per level, so the href is built as "../".repeat(depth).
// ========================================
export function current_app_depth_fun(): number {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return 0;
  }
  const marker = "/app/";
  const marker_index = window.location.pathname.lastIndexOf(marker);
  if (marker_index === -1) return 0;
  const after_app = window.location.pathname.slice(
    marker_index + marker.length,
  );
  const slash_index = after_app.lastIndexOf("/");
  if (slash_index === -1) return 0;
  return after_app
    .slice(0, slash_index)
    .split("/")
    .filter((part) => part.length > 0).length;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
