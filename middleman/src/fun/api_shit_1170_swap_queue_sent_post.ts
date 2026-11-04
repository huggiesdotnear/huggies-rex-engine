// ========================================
// API_SHIT_1170_SWAP_QUEUE_SENT_POST
// POST /api/shit-1170/swap-queue/{swap_id}/sent — record that the swap
// was sent.
//
// the body:
//   { "txHash": "...", "status": "succeeded", "amountOut": "..." }
//
// ONE call for one swap: a swap is one trade, and the swap page reports
// the whole thing in one call.
//
// `status` is optional: `succeeded` or `failed`. when it is left out the
// status is `sent`, which means "it went out and we do not know how it
// went yet".
//
// `amountOut` is optional too. it is the amount that came out of THAT
// send, in the output token's smallest unit. two accounts executing the
// same queued swap get two different amounts out, because the pools
// moved between the two sends.
//
// --- WHY --- the account comes from the HEADER and the body does NOT
// repeat it: the key IS the account. a body that named the account
// could name somebody else's, and then the check would be a suggestion.
//
// --- WHY --- the request is checked HERE and not only on the server: a
// send with no hash is a programming mistake, and catching it before the
// request means the caller gets a clear message instead of a 400 from
// the wire.
//
// --- WHY --- the path is built HERE and not read out of the endpoint
// map: the swap_id sits in the MIDDLE of the path.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type {
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_SWAP_QUEUE_SENT_REQUEST,
} from "../types/shit_1170_swap_queue";

export async function api_shit_1170_swap_queue_sent_post(
  base_url: string,
  swap_id: string,
  body: SHIT_1170_SWAP_QUEUE_SENT_REQUEST,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_SWAP_QUEUE> {
  const swap_id_trimmed = swap_id.trim();
  if (swap_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_swap_queue_sent_post failed: invalid_request: a swap id is required",
    );
  }
  if (body.txHash.trim().length === 0) {
    throw new Error(
      "api_shit_1170_swap_queue_sent_post failed: invalid_request: a send must carry a transaction hash",
    );
  }

  const json = await api_call<SHIT_1170_SWAP_QUEUE>({
    base_url,
    key: "api_shit_1170_swap_queue",
    path: `/api/shit-1170/swap-queue/${encodeURIComponent(swap_id_trimmed)}/sent`,
    method: "POST",
    body,
    options,
    label: "SHIT_1170 SWAP QUEUE SENT POST",
    fallback: "api_shit_1170_swap_queue_sent_post failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.swapId !== "string" ||
    !Array.isArray(json.accounts)
  ) {
    throw new Error(
      "api_shit_1170_swap_queue_sent_post failed: invalid_response: expected a json object with a swapId and an accounts array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
