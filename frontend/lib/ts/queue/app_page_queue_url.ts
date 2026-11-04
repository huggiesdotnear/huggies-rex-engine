// ========================================
// the queue page's url parameter: `?queue=`.
//
// --- WHY IT IS `?queue=` AND NOT THE SHARED `?id=`: the shared reader
// is for a page that is ABOUT one thing — a token's page, an account, a
// dao. the queue page is about a queued batch, and `queue` says so in
// the link. it also does not collide with the token page's `?id=`.
//
// --- WHY IT IMPORTS NOTHING: the rule is the whole of it.
const URL_QUEUE_PARAM = "queue";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// trim a raw url value, treating blank as absent.
//
// --- WHY --- blank is treated as absent: a trailing `?queue=` link
// points at nothing, and an empty id is not a batch.
function normalize_param_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// ========================================
// --- READ ------------------------------
// the `?queue=` off the current url, or null when there is none.
function read_url_queue_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_param_fun(params.get(URL_QUEUE_PARAM));
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// put the queue id on the url, without a reload.
//
// --- WHY --- `replaceState` and not `pushState`: the page is about ONE
// batch, and the id does not change while the reader is on it. a
// history entry per id would fill the back button with the same page.
function write_url_queue_fun(queue_id: string | null): void {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  const value = normalize_param_fun(queue_id);
  if (value === null) {
    url.searchParams.delete(URL_QUEUE_PARAM);
  } else {
    url.searchParams.set(URL_QUEUE_PARAM, value);
  }
  window.history.replaceState(null, "", url.toString());
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_QUEUE_URL = {
  read: read_url_queue_fun,
  write: write_url_queue_fun,
  normalize: normalize_param_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
