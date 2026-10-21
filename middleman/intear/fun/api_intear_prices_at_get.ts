// ========================================
// API_INTEAR_PRICES_AT_GET
// GET /prices/at — prices of tokens at a specific timestamp, up to
// 100 queries in one call. returns `null` for a token that does not
// exist and "0" before its first price.
// ========================================

import type {
  prices_at_params,
  prices_at_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_prices_at_get(
  params: prices_at_params,
): Promise<prices_at_response> {
  // --- WHY --- this endpoint does not take a normal params object:
  // the server wants one `at=<token>:<timestamp_millis>` value with
  // the pairs comma separated, not `queries[0][token]=…`.
  const at = params.queries
    .map(
      (query) => `${encodeURIComponent(query.token)}:${query.timestamp_millis}`,
    )
    .join(",");

  return api_intear_get<prices_at_response>({
    key: "api_intear_prices_at",
    params: { at },
    label: "INTEAR PRICES AT GET",
    fallback: "api_intear_prices_at_get failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
