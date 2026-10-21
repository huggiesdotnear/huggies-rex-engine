// ========================================
// API_INTEAR_TOKENS_SEARCH
// GET /tokens/search — fuzzy search over token names and symbols.
// unlike /tokens this needs no `sort`, and takes a `q`.
// ========================================

import type {
  token_requested_field,
  tokens_search_params,
  tokens_search_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_tokens_search<
  f extends readonly token_requested_field[],
>(params: tokens_search_params<f>): Promise<tokens_search_response<f>> {
  return api_intear_get<tokens_search_response<f>>({
    key: "api_intear_tokens_search",
    params,
    label: "INTEAR TOKENS SEARCH",
    fallback: "api_intear_tokens_search failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
