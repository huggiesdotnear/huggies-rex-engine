// ========================================
// API_SHIT_1170_TX_QUEUE_FACETS_GET
// GET /api/shit-1170/tx-queue/facets — the CONTRACTS and the ACCOUNTS
// the feed's filter bar offers.
//
// the answer:
//   {
//     "contracts": [ { "contractId": "ref.finance.near", "count": 12 } ],
//     "accounts":  [ { "accountId": "alice.near", "count": 3 } ]
//   }
//
// a `limit` query param, default 40. the limit applies to BOTH lists.
//
// --- WHY --- THE ROUTE IS OPEN: the queue list is open, and the facets
// are a summary of the same thing. a reader who can read the feed can
// read what is in it. the api key is passed when there is one, and it
// is not demanded.
//
// --- WHY --- the two lists are checked TOGETHER and not one at a time:
// the route answers both or it answers neither, so an answer that holds
// one and misses the other is a broken answer.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_TX_QUEUE_FACETS } from "../types/shit_1170_tx_queue_facets";
import type { SHIT_1170_TX_QUEUE_FACETS_QUERY } from "../types/shit_1170_tx_queue_query";

export async function api_shit_1170_tx_queue_facets_get(
  base_url: string,
  query: SHIT_1170_TX_QUEUE_FACETS_QUERY = {},
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_TX_QUEUE_FACETS> {
  const json = await api_call<SHIT_1170_TX_QUEUE_FACETS>({
    base_url,
    key: "api_shit_1170_tx_queue_facets",
    query: { limit: query.limit },
    method: "GET",
    options,
    label: "SHIT_1170 TX QUEUE FACETS GET",
    fallback: "api_shit_1170_tx_queue_facets_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    !Array.isArray(json.contracts) ||
    !Array.isArray(json.accounts)
  ) {
    throw new Error(
      "api_shit_1170_tx_queue_facets_get failed: invalid_response: expected a json object with a contracts array and an accounts array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
