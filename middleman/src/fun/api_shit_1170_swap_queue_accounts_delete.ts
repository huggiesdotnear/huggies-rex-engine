// ========================================
// API_SHIT_1170_SWAP_QUEUE_ACCOUNTS_DELETE
// DELETE /api/shit-1170/swap-queue/{swap_id}/accounts/{account_id} —
// remove YOUR OWN account from a queued swap.
//
// the rule: the api key must belong to the account being removed. you
// can remove yourself from a swap, and only yourself.
//
// --- WHY --- a row that already carries a HASH is HISTORY and is not
// deleted: the swap happened, and the swap shows who did it.
//
// --- WHY --- the path is built HERE and not read out of the endpoint
// map: the swap_id and the account_id both sit in the MIDDLE of the
// path.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_SWAP_QUEUE } from "../types/shit_1170_swap_queue";

export async function api_shit_1170_swap_queue_accounts_delete(
  base_url: string,
  swap_id: string,
  account_id: string,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_SWAP_QUEUE> {
  const swap_id_trimmed = swap_id.trim();
  if (swap_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_swap_queue_accounts_delete failed: invalid_request: a swap id is required",
    );
  }
  const account_id_trimmed = account_id.trim();
  if (account_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_swap_queue_accounts_delete failed: invalid_request: an account id is required",
    );
  }

  const json = await api_call<SHIT_1170_SWAP_QUEUE>({
    base_url,
    key: "api_shit_1170_swap_queue",
    path: `/api/shit-1170/swap-queue/${encodeURIComponent(swap_id_trimmed)}/accounts/${encodeURIComponent(account_id_trimmed)}`,
    method: "DELETE",
    options,
    label: "SHIT_1170 SWAP QUEUE ACCOUNTS DELETE",
    fallback: "api_shit_1170_swap_queue_accounts_delete failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.swapId !== "string" ||
    !Array.isArray(json.accounts)
  ) {
    throw new Error(
      "api_shit_1170_swap_queue_accounts_delete failed: invalid_response: expected a json object with a swapId and an accounts array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
