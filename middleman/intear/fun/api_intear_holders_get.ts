// ========================================
// API_INTEAR_HOLDERS_GET
// GET /holders — one page of the holders of a single token.
// ========================================

import type {
  holders_get_params,
  holders_get_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_holders_get(
  params: holders_get_params,
): Promise<holders_get_response> {
  return api_intear_get<holders_get_response>({
    key: "api_intear_holders",
    params,
    label: "INTEAR HOLDERS GET",
    fallback: "api_intear_holders_get failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
