// ========================================
// API_SHIT_1170_TX_QUEUE_STATS_CONTRACTS_GET
// GET /api/shit-1170/tx-queue/stats/contracts — how many queued
// transactions hit each contract.
//
// the answer:
//   { "items": [ { "contractId": "ref.finance.near", "count": 12 } ] }
//
// ordered by count, biggest first. a `limit` query param, default 20.
//
// --- WHY --- this route exists even though the ui does not read it
// yet: the `contract_id` COLUMN is the whole reason it is a column. a
// group by on an indexed column is a cheap read, and a group by inside
// a json blob is a scan of every row, every time.
//
// --- WHY --- the api key is required even though the answer says
// nothing private: the key is the gate for the whole api, and one
// route without it would be a hole in that gate.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_TX_QUEUE_CONTRACT_STATS } from "../types/shit_1170_tx_queue";
import type { SHIT_1170_TX_QUEUE_STATS_QUERY } from "../types/shit_1170_tx_queue_query";

export async function api_shit_1170_tx_queue_stats_contracts_get(
  base_url: string,
  query: SHIT_1170_TX_QUEUE_STATS_QUERY = {},
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_TX_QUEUE_CONTRACT_STATS> {
  const json = await api_call<SHIT_1170_TX_QUEUE_CONTRACT_STATS>({
    base_url,
    key: "api_shit_1170_tx_queue_stats_contracts",
    query: { limit: query.limit },
    method: "GET",
    options,
    label: "SHIT_1170 TX QUEUE STATS CONTRACTS GET",
    fallback: "api_shit_1170_tx_queue_stats_contracts_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    !Array.isArray(json.items)
  ) {
    throw new Error(
      "api_shit_1170_tx_queue_stats_contracts_get failed: invalid_response: expected a json object with an items array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
