// ========================================
// the token id on the page, read from the `?id=` url parameter.
//
// the reading itself is the shared lib/ts/url_id.ts, so the token page
// and the account page cannot drift apart on how the id is found. the
// id is null when the url carries none.
// ========================================
import { HUGGIES_URL_ID } from "./url_id";
// ========================================
// --- READ ------------------------------
// the `?id=` off the current url, or null when there is none.
//
// --- WHY --- blank is treated as absent: a trailing `?id=` link points at
// nothing, and rendering the empty token would be worse than saying the
// id is missing.
function token_id_from_url_fun(): string | null {
  return HUGGIES_URL_ID.read();
}
// ========================================
// public surface, in one place so components have a single import.
export const HUGGIES_TOKEN_PAGE_TOKEN_ID = {
  get: token_id_from_url_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
