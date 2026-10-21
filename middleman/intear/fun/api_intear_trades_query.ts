// ========================================
// API_INTEAR_TRADES_QUERY
// GET /trades — every trade, filterable by token, side, counterparty
// and minimum usd value. paginates with a cursor.
// ========================================

import type {
  trade_requested_field,
  trades_query_params,
  trades_query_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_trades_query<
  f extends readonly trade_requested_field[],
>(params: trades_query_params<f>): Promise<trades_query_response<f>> {
  return api_intear_get<trades_query_response<f>>({
    key: "api_intear_trades",
    params,
    label: "INTEAR TRADES QUERY",
    fallback: "api_intear_trades_query failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
