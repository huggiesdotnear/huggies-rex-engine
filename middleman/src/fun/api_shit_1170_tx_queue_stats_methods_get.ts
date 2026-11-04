// ========================================
// API_SHIT_1170_TX_QUEUE_STATS_METHODS_GET
// GET /api/shit-1170/tx-queue/stats/methods — how many queued
// transactions call each method.
//
// the answer:
//   { "items": [ { "method": "ft_swap", "contractId": "ref.finance.near", "count": 9 } ] }
//
// ordered by count, biggest first. a `limit` query param, default 20.
//
// --- WHY --- the methods carry the contract id: `ft_swap` on two
// different contracts is two different transactions, and a method count
// without the contract would blend them, and "the most common methods"
// would be a misleading number.
//
// --- WHY --- the api key is required even though the answer says
// nothing private: the key is the gate for the whole api, and one
// route without it would be a hole in that gate.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_TX_QUEUE_METHOD_STATS } from "../types/shit_1170_tx_queue";
import type { SHIT_1170_TX_QUEUE_STATS_QUERY } from "../types/shit_1170_tx_queue_query";

export async function api_shit_1170_tx_queue_stats_methods_get(
  base_url: string,
  query: SHIT_1170_TX_QUEUE_STATS_QUERY = {},
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_TX_QUEUE_METHOD_STATS> {
  const json = await api_call<SHIT_1170_TX_QUEUE_METHOD_STATS>({
    base_url,
    key: "api_shit_1170_tx_queue_stats_methods",
    query: { limit: query.limit },
    method: "GET",
    options,
    label: "SHIT_1170 TX QUEUE STATS METHODS GET",
    fallback: "api_shit_1170_tx_queue_stats_methods_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    !Array.isArray(json.items)
  ) {
    throw new Error(
      "api_shit_1170_tx_queue_stats_methods_get failed: invalid_response: expected a json object with an items array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
