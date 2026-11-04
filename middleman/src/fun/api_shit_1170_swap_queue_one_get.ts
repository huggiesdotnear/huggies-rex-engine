// ========================================
// API_SHIT_1170_SWAP_QUEUE_ONE_GET
// GET /api/shit-1170/swap-queue/{swap_id} — one queued swap.
//
// the reading is OPEN: anybody with an api key can read a queued swap.
// a swap is an open offer, and reading it is what lets a reader find it
// and act on it.
//
// --- WHY --- the path is built HERE and not read out of the endpoint
// map: the swap_id sits in the MIDDLE of the path.
// ========================================

import { api_call } from "../stuff/api_call";
import type { REQUEST_OPTIONS } from "../stuff/request_options";
import type { SHIT_1170_SWAP_QUEUE } from "../types/shit_1170_swap_queue";

export async function api_shit_1170_swap_queue_one_get(
  base_url: string,
  swap_id: string,
  options: REQUEST_OPTIONS = {},
): Promise<SHIT_1170_SWAP_QUEUE> {
  const swap_id_trimmed = swap_id.trim();
  if (swap_id_trimmed.length === 0) {
    throw new Error(
      "api_shit_1170_swap_queue_one_get failed: invalid_request: a swap id is required",
    );
  }

  const json = await api_call<SHIT_1170_SWAP_QUEUE>({
    base_url,
    key: "api_shit_1170_swap_queue",
    path: `/api/shit-1170/swap-queue/${encodeURIComponent(swap_id_trimmed)}`,
    method: "GET",
    options,
    label: "SHIT_1170 SWAP QUEUE ONE GET",
    fallback: "api_shit_1170_swap_queue_one_get failed",
  });

  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    typeof json.swapId !== "string" ||
    !Array.isArray(json.accounts)
  ) {
    throw new Error(
      "api_shit_1170_swap_queue_one_get failed: invalid_response: expected a json object with a swapId and an accounts array",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
