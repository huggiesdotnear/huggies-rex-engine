// ========================================
// read the `?tx=` off the current url, the one way.
//
// the transaction page shows one transaction, named by the `?tx=` url
// parameter — a transaction hash.
//
// --- WHY IT IS NOT THE SHARED `?id=` READER: the parameter is named
// `tx` and not `id`, so a link to a transaction says what it points
// at. the account page uses `?id=` and the transaction page uses
// `?tx=`, and a reader can tell them apart in a link.
//
// --- WHY IT IMPORTS NOTHING: the rule is the whole of it.
const URL_TX_PARAM = "tx";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// trim the raw `?tx=` value, treating blank as absent.
//
// --- WHY --- blank is treated as absent: a trailing `?tx=` link points
// at nothing, and rendering an empty transaction would be worse than
// saying the hash is missing.
function normalize_tx_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// ========================================
// --- READ ------------------------------
// the `?tx=` off the current url, or null when there is none.
//
// --- WHY --- window checks: the module is imported by a start script
// that runs in the browser, but the ts is also loaded in tests and on
// the server, where there is no window.
function read_url_tx_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_tx_fun(params.get(URL_TX_PARAM));
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the reader surface. exported as one object so callers have a single
// import.
export const HUGGIES_URL_TX = {
  read: read_url_tx_fun,
  normalize: normalize_tx_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
