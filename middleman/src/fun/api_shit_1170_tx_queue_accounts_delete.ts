// ========================================
// API_SHIT_1170_TX_QUEUE_ACCOUNTS_DELETE
// DELETE /api/shit-1170/tx-queue/{queue_id}/accounts/{account_id} —
// remove YOUR OWN account from a queued batch.
//
// the rule is the same as the add: the api key must belong to the
// account being removed. you can remove yourself from a queue, and only
// yourself.
//
// what it writes is the deletion of the account's rows under every
// transaction of the batch. a row that already carries a hash is
// HISTORY and is not deleted — the tx happened, and the queue shows who
// did it.
//
// --- WHY --- the request has NO BODY. the account to remove is in the
// path, and the api key in the header says who is asking. a body would
// say the same thing twice, and a body that named somebody else's
// account would make the check a suggestion.
//
// --- WHY --- `body` is left undefined and not sent as `{}`: api_call
// only adds the content-type header and the body when there IS a body,
// and a DELETE with no body is what the route expects.
//
// --- WHY --- the path is built HERE and not read out of the endpoint
// map: the queue_id and the account_id both sit in the MIDDLE of the
// path.
//
// 404 = there is no queue with that id, or the account was not on it.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_TX_QUEUE } from "../types/shit_1170_tx_queue";

export async function api_shit_1170_tx_queue_accounts_delete(
  base_url: string,
  queue_id: string,
  account_id: string,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_TX_QUEUE> {
  const queue_id_trimmed = queue_id.trim();
  if (queue_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_tx_queue_accounts_delete failed: invalid_request: a queue id is required",
    );
  }
  const account_id_trimmed = account_id.trim();
  if (account_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_tx_queue_accounts_delete failed: invalid_request: an account id is required",
    );
  }

  const json = await api_call<SHIT_1170_TX_QUEUE>({
    base_url,
    key: "api_shit_1170_tx_queue",
    path: `/api/shit-1170/tx-queue/${encodeURIComponent(queue_id_trimmed)}/accounts/${encodeURIComponent(account_id_trimmed)}`,
    method: "DELETE",
    options,
    label: "SHIT_1170 TX QUEUE ACCOUNTS DELETE",
    fallback: "api_shit_1170_tx_queue_accounts_delete failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.queueId !== "string" ||
    !Array.isArray(json.transactions)
  ) {
    throw new Error(
      "api_shit_1170_tx_queue_accounts_delete failed: invalid_response: expected a json object with a queueId and a transactions array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
