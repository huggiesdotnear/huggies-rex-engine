// ========================================
// read the `?id=` off the current url, the one way.
//
// every page that shows one thing reads it from the url: the token
// page, the account page, the pumpopoly page, the dao page. they all
// want the same thing — the id, trimmed, and blank treated as absent.
//
// --- WHY --- one helper and not four copies: the rule is small and
// easy to get subtly wrong. a trailing `?id=` link points at nothing,
// so blank must read as absent rather than as an empty id. if each page
// had its own copy, one of them could drift and render an empty
// heading or load a blank account.
//
// --- WHY --- it lives in lib/ts and not in a page's own file: it is
// shared by pages on more than one level of the app, so it keeps a
// plain name rather than a page prefix.
//
// --- WHY --- it imports nothing: the rule is the whole of it, so it
// must not drag a page's own module in with it.
const URL_ID_PARAM = "id";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// trim the raw `?id=` value, treating blank as absent.
//
// --- WHY --- blank is treated as absent: a trailing `?id=` link points
// at nothing, and rendering the empty thing would be worse than
// saying the id is missing.
function normalize_id_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// --- READ ------------------------------
// the `?id=` off the current url, or null when there is none.
//
// --- WHY --- window checks: the module is imported by a start script
// that runs in the browser, but the ts is also loaded in tests and on
// the server, where there is no window.
function read_url_id_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_id_fun(params.get(URL_ID_PARAM));
}
// ========================================
// public surface, in one place so callers have a single import.
export const HUGGIES_URL_ID = {
  read: read_url_id_fun,
  normalize: normalize_id_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
