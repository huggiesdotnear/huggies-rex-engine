// ========================================
// API_INTEAR_TRANSFERS_QUERY
// GET /transfers — token transfers, filterable by sender, receiver,
// account, kind or token. paginates with a cursor.
// ========================================

import type {
  transfer_requested_field,
  transfers_query_params,
  transfers_query_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_transfers_query<
  f extends readonly transfer_requested_field[],
>(params: transfers_query_params<f>): Promise<transfers_query_response<f>> {
  return api_intear_get<transfers_query_response<f>>({
    key: "api_intear_transfers",
    params,
    label: "INTEAR TRANSFERS QUERY",
    fallback: "api_intear_transfers_query failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
