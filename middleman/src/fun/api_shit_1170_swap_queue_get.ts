// ========================================
// API_SHIT_1170_SWAP_QUEUE_GET
// GET /api/shit-1170/swap-queue — the swap list, filterable.
//
// the list is OPEN: anyone with an api key can list the swaps. a queued
// swap is an open offer, and hiding it would defeat the point.
//
// the answer is `{ "items": [ ...one swap each... ], "total": N,
// "nextCursor": "..." }`, where `total` is the count BEFORE the limit
// and the cursor took their cut. it is how many pages there are.
//
// --- WHY --- the query names are snake_case and are NOT renamed:
// `serde_urlencoded` matches the query key literally, so `tokenIn` would
// never see the `token_in` the route reads and the filter would be
// silently ignored.
//
// --- WHY --- `account_id` goes out as ONE COMMA SEPARATED STRING: the
// route reads one value per param, so a list would need the param to be
// repeated. one string carries many values, and a single value still
// works.
//
// --- WHY --- `hide_sent` needs an account and the check is made HERE as
// well as on the server: "has this account sent it" is a question about
// ONE account. a swap can be sent by alice and not by bob, so there is
// no single answer about all the accounts at once. asking for the
// filter without the account is a mistake worth naming before the round
// trip, and the backend answers a 400 for the same reason.
//
// --- WHY --- `hide_sent` goes out as the word `true` and not as `1`:
// the backend reads both, and the word is the readable one.
//
// --- WHY --- `cursor` is handed back EXACTLY as the backend gave it:
// the cursor is opaque, and a middleman that reshaped it would break
// the page the moment the backend changed the order.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_SWAP_QUEUE_LIST } from "../types/shit_1170_swap_queue";
import type { SHIT_1170_SWAP_QUEUE_QUERY } from "../types/shit_1170_swap_queue";

export async function api_shit_1170_swap_queue_get(
  base_url: string,
  query: SHIT_1170_SWAP_QUEUE_QUERY = {},
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_SWAP_QUEUE_LIST> {
  const account_id = query.account_id?.trim();
  if (query.hide_sent && !account_id) {
    throw new Error(
      "api_shit_1170_swap_queue_get failed: invalid_request: hide_sent needs an account_id — it is a filter on one account's view",
    );
  }

  const json = await api_call<SHIT_1170_SWAP_QUEUE_LIST>({
    base_url,
    key: "api_shit_1170_swap_queue",
    query: {
      account_id,
      hide_sent: query.hide_sent,
      token_in: query.token_in?.trim(),
      token_out: query.token_out?.trim(),
      limit: query.limit,
      cursor: query.cursor?.trim(),
    },
    method: "GET",
    options,
    label: "SHIT_1170 SWAP QUEUE GET",
    fallback: "api_shit_1170_swap_queue_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    !Array.isArray(json.items) ||
    typeof json.total !== "number" ||
    (json.nextCursor !== null && typeof json.nextCursor !== "string")
  ) {
    throw new Error(
      "api_shit_1170_swap_queue_get failed: invalid_response: expected a json object with an items array, a total and a nextCursor",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
