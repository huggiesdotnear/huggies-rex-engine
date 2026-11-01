// ========================================
// the swap page's url parameters: `?in=` and `?out=`.
//
// the swap page holds TWO tokens, so it needs TWO url parameters. they
// are named `in` and `out` rather than a single `?id=`, because a link
// to a swap says what it swaps: `swap.html?in=near&out=usdt.tether-token.near`.
//
// --- WHY IT DOES NOT REUSE THE SHARED `?id=` READER: that reader is
// for a page that holds ONE thing — a token, an account, a dao. the
// swap page holds two, and two named parameters are clearer in a link
// than one parameter that changes meaning depending on the page.
//
// --- WHY IT IMPORTS NOTHING: the rule is the whole of it.
const URL_IN_PARAM = "in";
const URL_OUT_PARAM = "out";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// trim a raw url value, treating blank as absent.
//
// --- WHY --- blank is treated as absent: a trailing `?in=` link points
// at nothing, and rendering an empty token would be worse than saying
// the token is missing.
function normalize_token_id_fun(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// ========================================
// --- READ ------------------------------
// the `?in=` off the current url, or null when there is none.
function read_url_in_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_token_id_fun(params.get(URL_IN_PARAM));
}
// ========================================
// the `?out=` off the current url, or null when there is none.
function read_url_out_fun(): string | null {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return normalize_token_id_fun(params.get(URL_OUT_PARAM));
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// put both tokens on the url, without a reload.
//
// --- WHY --- `replaceState` and not `pushState`: picking a token is a
// refinement of the same view, not a new page the reader can go back
// through. a history entry per token pick fills the back button with
// a stack of half-finished swaps.
//
// --- WHY --- the OTHER token is kept: a swap link is worth keeping
// whole. dropping `?out=` when only `?in=` changed would leave a link
// that swapped to nothing.
function write_url_tokens_fun(
  token_in: string | null,
  token_out: string | null,
): void {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  if (token_in === null) {
    url.searchParams.delete(URL_IN_PARAM);
  } else {
    url.searchParams.set(URL_IN_PARAM, token_in);
  }
  if (token_out === null) {
    url.searchParams.delete(URL_OUT_PARAM);
  } else {
    url.searchParams.set(URL_OUT_PARAM, token_out);
  }
  window.history.replaceState(null, "", url.toString());
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_SWAP_URL = {
  read_in: read_url_in_fun,
  read_out: read_url_out_fun,
  write: write_url_tokens_fun,
  normalize: normalize_token_id_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
