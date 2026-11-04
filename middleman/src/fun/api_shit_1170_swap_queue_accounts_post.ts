// ========================================
// API_SHIT_1170_SWAP_QUEUE_ACCOUNTS_POST
// POST /api/shit-1170/swap-queue/{swap_id}/accounts — add YOUR OWN
// account to a queued swap.
//
// the body:
//   { "accountId": "alice.near" }
//
// the rule: the api key in the header must belong to that very account.
// you can only ever add YOURSELF.
//
// --- WHY --- the path is built HERE and not read out of the endpoint
// map: the swap_id sits in the MIDDLE of the path.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type {
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_SWAP_QUEUE_ACCOUNT_REQUEST,
} from "../types/shit_1170_swap_queue";

export async function api_shit_1170_swap_queue_accounts_post(
  base_url: string,
  swap_id: string,
  body: SHIT_1170_SWAP_QUEUE_ACCOUNT_REQUEST,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_SWAP_QUEUE> {
  const swap_id_trimmed = swap_id.trim();
  if (swap_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_swap_queue_accounts_post failed: invalid_request: a swap id is required",
    );
  }

  const json = await api_call<SHIT_1170_SWAP_QUEUE>({
    base_url,
    key: "api_shit_1170_swap_queue",
    path: `/api/shit-1170/swap-queue/${encodeURIComponent(swap_id_trimmed)}/accounts`,
    method: "POST",
    body,
    options,
    label: "SHIT_1170 SWAP QUEUE ACCOUNTS POST",
    fallback: "api_shit_1170_swap_queue_accounts_post failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.swapId !== "string" ||
    !Array.isArray(json.accounts)
  ) {
    throw new Error(
      "api_shit_1170_swap_queue_accounts_post failed: invalid_response: expected a json object with a swapId and an accounts array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
