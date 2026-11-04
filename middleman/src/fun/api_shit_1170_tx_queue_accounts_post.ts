// ========================================
// API_SHIT_1170_TX_QUEUE_ACCOUNTS_POST
// POST /api/shit-1170/tx-queue/{queue_id}/accounts — add YOUR OWN
// account to a queued batch.
//
// the body is one account id, and the rule is simple: the api key in
// the header must belong to that very account. you can only ever add
// YOURSELF. the backend answers a 403 when the two do not match.
//
// what it writes is an account row for every transaction of the batch,
// with `status = pending`. that is how an account says "I want this
// one" before it has signed it, and it puts the tx in that account's
// feed.
//
// --- WHY --- the path is built HERE and not read out of the endpoint
// map: the queue_id sits in the MIDDLE of the path.
//
// --- WHY --- the account id is checked HERE and not only on the
// server: an empty account id is a programming mistake, and catching it
// before the request means the caller gets a clear message instead of a
// 403 from the wire.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type {
  SHIT_1170_TX_QUEUE,
  SHIT_1170_TX_QUEUE_ACCOUNT_REQUEST,
} from "../types/shit_1170_tx_queue";

export async function api_shit_1170_tx_queue_accounts_post(
  base_url: string,
  queue_id: string,
  body: SHIT_1170_TX_QUEUE_ACCOUNT_REQUEST,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_TX_QUEUE> {
  const queue_id_trimmed = queue_id.trim();
  if (queue_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_tx_queue_accounts_post failed: invalid_request: a queue id is required",
    );
  }
  const account_id = body.accountId?.trim();
  if (!account_id) {
    throw new Error(
      "api_shit_1170_tx_queue_accounts_post failed: invalid_request: an account id is required",
    );
  }

  const json = await api_call<SHIT_1170_TX_QUEUE>({
    base_url,
    key: "api_shit_1170_tx_queue",
    path: `/api/shit-1170/tx-queue/${encodeURIComponent(queue_id_trimmed)}/accounts`,
    method: "POST",
    body: { accountId: account_id },
    options,
    label: "SHIT_1170 TX QUEUE ACCOUNTS POST",
    fallback: "api_shit_1170_tx_queue_accounts_post failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.queueId !== "string" ||
    !Array.isArray(json.transactions)
  ) {
    throw new Error(
      "api_shit_1170_tx_queue_accounts_post failed: invalid_response: expected a json object with a queueId and a transactions array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
