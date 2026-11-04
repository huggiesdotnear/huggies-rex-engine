// ========================================
// API_SHIT_1170_TX_QUEUE_ONE_GET
// GET /api/shit-1170/tx-queue/{queue_id} — one queued batch, with its
// transactions and its accounts.
//
// the answer is the same shape as one item of the list: the queue, its
// calls in `position` order, and the WHO.
//
// --- WHY --- the path is built HERE and not read out of the endpoint
// map: the queue_id sits in the MIDDLE of the path, so the whole path
// cannot be a constant. the map keeps the routes whose path is fixed.
//
// --- WHY --- the queue_id is url-encoded: it is a uuid today, but the
// path is a url and a path piece with a slash in it would change the
// route the request lands on.
//
// 404 = there is no queue with that id. the error is thrown like any
// other.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_TX_QUEUE } from "../types/shit_1170_tx_queue";

export async function api_shit_1170_tx_queue_one_get(
  base_url: string,
  queue_id: string,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_TX_QUEUE> {
  const queue_id_trimmed = queue_id.trim();
  if (queue_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_tx_queue_one_get failed: invalid_request: a queue id is required",
    );
  }

  const json = await api_call<SHIT_1170_TX_QUEUE>({
    base_url,
    key: "api_shit_1170_tx_queue",
    path: `/api/shit-1170/tx-queue/${encodeURIComponent(queue_id_trimmed)}`,
    method: "GET",
    options,
    label: "SHIT_1170 TX QUEUE ONE GET",
    fallback: "api_shit_1170_tx_queue_one_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.queueId !== "string" ||
    !Array.isArray(json.transactions)
  ) {
    throw new Error(
      "api_shit_1170_tx_queue_one_get failed: invalid_response: expected a json object with a queueId and a transactions array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
