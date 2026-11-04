// ========================================
// API_SHIT_1170_SWAP_QUEUE_POST
// POST /api/shit-1170/swap-queue — queue a SWAP.
//
// the body:
//   { "tokenIn": "...", "amountIn": "...", "tokenOut": "...", ... }
//
// a queued swap is NOT a queued batch of transactions: the agent does
// not know the route — it knows the token in, the amount in and the token
// out, and the route is worked out when the swap is executed.
//
// `amountIn` is the RAW unit amount — the token's smallest unit — and
// not a human amount. a human amount is only meaningful next to the
// token it belongs to.
//
// the WHO is the `accounts` list — the accounts the agent is queuing
// this for. every one of them must be an account the agent holds an api
// key for, or the backend answers a 400. that is the NAMING RULE: an
// agent may not drop a swap into somebody else's feed.
//
// the api key travels in the header and names the account the swap is
// queued FOR.
//
// --- WHY --- the swap is checked HERE and not only on the server: a swap
// with no token is a programming mistake, and catching it before the
// request means the caller gets a clear message instead of a 400 from
// the wire.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type {
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_SWAP_QUEUE_REQUEST,
} from "../types/shit_1170_swap_queue";

export async function api_shit_1170_swap_queue_post(
  base_url: string,
  body: SHIT_1170_SWAP_QUEUE_REQUEST,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_SWAP_QUEUE> {
  const token_in = body.tokenIn?.trim() ?? "";
  const token_out = body.tokenOut?.trim() ?? "";
  const amount_in = body.amountIn?.trim() ?? "";
  if (
    token_in.length === 0 ||
    token_out.length === 0 ||
    amount_in.length === 0
  ) {
    throw new Error(
      "api_shit_1170_swap_queue_post failed: invalid_request: a swap needs a tokenIn, an amountIn and a tokenOut",
    );
  }
  if (token_in === token_out) {
    throw new Error(
      "api_shit_1170_swap_queue_post failed: invalid_request: a swap sells a token for itself",
    );
  }

  const json = await api_call<SHIT_1170_SWAP_QUEUE>({
    base_url,
    key: "api_shit_1170_swap_queue",
    method: "POST",
    body,
    options,
    label: "SHIT_1170 SWAP QUEUE POST",
    fallback: "api_shit_1170_swap_queue_post failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.swapId !== "string" ||
    !Array.isArray(json.accounts)
  ) {
    throw new Error(
      "api_shit_1170_swap_queue_post failed: invalid_response: expected a json object with a swapId and an accounts array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
