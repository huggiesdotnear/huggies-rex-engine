// ========================================
// API_INTEAR_TOKENS_POST
// POST /tokens — the same endpoint as api_intear_tokens_get, with the
// params in a JSON body instead of the query string.
// ========================================
//
// --- WHY --- a GET puts the params in the url, and the api refuses a
// url over about 8KB with a 414. a list of token ids is the worst
// case, because a near account id is 64 hex characters and a token id
// adds a label on top:
//   wrap.near                                9 chars
//   token.rhealab.near                       18 chars
//   dac17f958....factory.bridge.near         60 chars
//   17208628f84f5d6ad...e36133a1            64 chars
// so only about 170 ids fit in one GET.
//
// a POST body has a 64KB limit — the same limit as a websocket
// message — which fits about 2,000 ids. the whole visible token list
// therefore arrives in ONE request instead of several.
// ========================================

import type {
  token_requested_field,
  tokens_get_params,
  tokens_get_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_post } from "./api_intear_post";

export async function api_intear_tokens_post<
  f extends readonly token_requested_field[],
>(params: tokens_get_params<f>): Promise<tokens_get_response<f>> {
  return api_intear_post<tokens_get_response<f>>({
    key: "api_intear_tokens",
    params,
    label: "INTEAR TOKENS POST",
    fallback: "api_intear_tokens_post failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
