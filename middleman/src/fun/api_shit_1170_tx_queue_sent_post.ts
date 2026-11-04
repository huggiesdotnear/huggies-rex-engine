// ========================================
// API_SHIT_1170_TX_QUEUE_SENT_POST
// POST /api/shit-1170/tx-queue/{queue_id}/sent — record that the
// transactions were sent.
//
// the body:
//   { "txHashes": [ { "txId": "...", "txHash": "...", "status": "succeeded" } ] }
//
// ONE call for the whole batch: the wallet sent every transaction in
// one popup, so the app reports every hash in one call.
//
// `txId` is required on each entry — it says which transaction of the
// batch the hash belongs to. `status` is optional: `succeeded` or
// `failed`. when it is left out the status is `sent`, which means "we
// do not know the outcome yet".
//
// --- WHY --- the account comes from the HEADER and the body does NOT
// repeat it: the key IS the account. a body that named the account
// could name somebody else's, and then the check would be a suggestion.
//
// --- WHY --- the request is checked HERE and not only on the server:
// an empty hash list is a programming mistake, and catching it before
// the request means the caller gets a clear message instead of a 400
// from the wire.
//
// --- WHY --- the path is built HERE and not read out of the endpoint
// map: the queue_id sits in the MIDDLE of the path.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type {
  SHIT_1170_TX_QUEUE,
  SHIT_1170_TX_QUEUE_SENT_REQUEST,
} from "../types/shit_1170_tx_queue";

export async function api_shit_1170_tx_queue_sent_post(
  base_url: string,
  queue_id: string,
  body: SHIT_1170_TX_QUEUE_SENT_REQUEST,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_TX_QUEUE> {
  const queue_id_trimmed = queue_id.trim();
  if (queue_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_tx_queue_sent_post failed: invalid_request: a queue id is required",
    );
  }
  if (!Array.isArray(body.txHashes) || body.txHashes.length === 0) {
    throw new Error(
      "api_shit_1170_tx_queue_sent_post failed: invalid_request: a send must carry at least one transaction hash",
    );
  }

  const json = await api_call<SHIT_1170_TX_QUEUE>({
    base_url,
    key: "api_shit_1170_tx_queue",
    path: `/api/shit-1170/tx-queue/${encodeURIComponent(queue_id_trimmed)}/sent`,
    method: "POST",
    body,
    options,
    label: "SHIT_1170 TX QUEUE SENT POST",
    fallback: "api_shit_1170_tx_queue_sent_post failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.queueId !== "string" ||
    !Array.isArray(json.transactions)
  ) {
    throw new Error(
      "api_shit_1170_tx_queue_sent_post failed: invalid_response: expected a json object with a queueId and a transactions array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
