// ========================================
// API_INTEAR_TOKENS_GET
// GET /tokens — token rows. `fields` narrows the returned row type,
// so passing `["symbol","price_usd"]` types the row accordingly.
// ========================================

import type {
  token_requested_field,
  tokens_get_params,
  tokens_get_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_tokens_get<
  f extends readonly token_requested_field[],
>(params: tokens_get_params<f>): Promise<tokens_get_response<f>> {
  return api_intear_get<tokens_get_response<f>>({
    key: "api_intear_tokens",
    params,
    label: "INTEAR TOKENS GET",
    fallback: "api_intear_tokens_get failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
