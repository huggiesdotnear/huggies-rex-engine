// ========================================
// API_INTEAR_ACCOUNTS_SEARCH
// GET /accounts/search — accounts whose id starts with `prefix`,
// newest activity first. used by an account picker.
// ========================================

import type {
  accounts_search_params,
  accounts_search_response,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_get } from "./api_intear_get";

export async function api_intear_accounts_search(
  params: accounts_search_params,
): Promise<accounts_search_response> {
  return api_intear_get<accounts_search_response>({
    key: "api_intear_accounts_search",
    params,
    label: "INTEAR ACCOUNTS SEARCH",
    fallback: "api_intear_accounts_search failed",
  });
}
// ========================================
// copyright 2026 by sleet.near
