// ========================================
// API_INTEAR_POSITIONS_GET
// GET /positions — the known positions of one account.
// ========================================

import type {
  positions_get_params,
  positions_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_positions_get(
  params: positions_get_params,
): Promise<positions_response> {
  return api_intear_get<positions_response>({
    key: "api_intear_positions",
    params,
    label: "INTEAR POSITIONS GET",
    fallback: "api_intear_positions_get failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
