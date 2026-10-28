// ========================================
// the token id on the page, read from the `?id=` url parameter.
//
// one place reads the url, so two components cannot drift apart on how
// the id is found. the id is null when the url carries none.
// ========================================
// --- READ ------------------------------
// the `?id=` off the current url, or null when there is none.
//
// --- WHY --- blank is treated as absent: a trailing `?id=` link points
// at nothing, and rendering the empty token would be worse than
// saying the id is missing.
function token_id_from_url_fun(): string | null {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("id");
  if (id === null) return null;
  const trimmed = id.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// public surface, in one place so components have a single import.
export const HUGGIES_TOKEN_PAGE_TOKEN_ID = {
  get: token_id_from_url_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
