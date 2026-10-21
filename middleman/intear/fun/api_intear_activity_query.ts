// ========================================
// API_INTEAR_ACTIVITY_QUERY
// GET /activity — trades and transfers of one account in a single
// feed, so the UI does not have to merge two endpoints itself.
// ========================================

import type {
  activity_query_params,
  activity_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_activity_query(
  params: activity_query_params,
): Promise<activity_response> {
  return api_intear_get<activity_response>({
    key: "api_intear_activity",
    params,
    label: "INTEAR ACTIVITY QUERY",
    fallback: "api_intear_activity_query failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
