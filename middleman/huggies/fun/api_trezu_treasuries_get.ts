// ========================================
// API_TREZU_TREASURIES_GET
// GET /api/trezu/user/treasuries — the treasuries (sputnik daos) an
// account belongs to, proxied through our own backend to trezu.
//
// same-origin call to our backend, which forwards to trezu and hands
// the json array back untouched. a non-2xx or a body that is not a
// json array throws a readable Error.
// ========================================

import { HUGGIES_BASE_URL } from "../stuff/huggies_base_url";
import { huggies_build_query } from "../stuff/huggies_build_query";
import { huggies_parse_error } from "../stuff/huggies_parse_error";
import { TREZU_ENDPOINT_PATHS } from "../stuff/trezu_endpoint_paths";
import type { TREZU_TREASURY } from "../types/trezu_treasury";
import type { TREZU_TREASURIES_QUERY } from "../types/trezu_treasuries_query";

export async function api_trezu_treasuries_get(
  query: TREZU_TREASURIES_QUERY,
): Promise<TREZU_TREASURY[]> {
  const account_id = query.accountId.trim();
  if (account_id.length === 0) {
    throw new Error(
      "api_trezu_treasuries_get failed: invalid_account_id: accountId is required and must not be blank",
    );
  }

  const params = huggies_build_query({
    accountId: account_id,
    includeHidden: query.includeHidden,
  });

  const path = TREZU_ENDPOINT_PATHS.api_trezu_treasuries;
  const url =
    params.length > 0
      ? `${HUGGIES_BASE_URL}${path}?${params}`
      : `${HUGGIES_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const error = await huggies_parse_error(
      response,
      "api_trezu_treasuries_get failed",
    );
    console.log("=============================");
    console.log(" TREZU TREASURIES GET FAILED on:", url);
    console.log(
      "RESPONSE STATUS:",
      `${response.status} - ${response.statusText}`,
    );
    console.log("ERROR:", error.message);
    console.log("=============================");
    throw error;
  }

  const json: unknown = await response.json();
  if (!Array.isArray(json)) {
    throw new Error(
      "api_trezu_treasuries_get failed: invalid_response: expected a json array of treasuries",
    );
  }

  console.log("=============================");
  console.log(" TREZU TREASURIES GET via GET on:", url);
  console.log(
    "RESPONSE STATUS:",
    `${response.status} - ${response.statusText}`,
  );
  console.log("RESPONSE COUNT:", json.length);
  console.log("=============================");
  return json as TREZU_TREASURY[];
}
// ========================================
// copyright 2026 by sleet.near
