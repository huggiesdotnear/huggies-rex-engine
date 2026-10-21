// ========================================
// API_INTEAR_BALANCES_GET
// GET /balances — the token balances of one account.
// ========================================

import type {
  balances_get_params,
  balances_get_response,
  token_requested_field,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_balances_get<
  f extends readonly token_requested_field[] = readonly token_requested_field[],
>(params: balances_get_params): Promise<balances_get_response<f>> {
  return api_intear_get<balances_get_response<f>>({
    key: "api_intear_balances",
    params,
    label: "INTEAR BALANCES GET",
    fallback: "api_intear_balances_get failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
