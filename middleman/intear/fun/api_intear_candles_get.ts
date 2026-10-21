// ========================================
// API_INTEAR_CANDLES_GET
// GET /candles — OHLCV series for up to 200 tokens per call.
// ========================================

import type {
  candles_get_params,
  candles_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_candles_get(
  params: candles_get_params,
): Promise<candles_response> {
  return api_intear_get<candles_response>({
    key: "api_intear_candles",
    params,
    label: "INTEAR CANDLES GET",
    fallback: "api_intear_candles_get failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
