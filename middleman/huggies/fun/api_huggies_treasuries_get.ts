// ========================================
// API_HUGGIES_TREASURIES_GET
// GET /api/trezu/user/treasuries — the treasuries (sputnik daos) an
// account belongs to, proxied through our own backend to trezu.
//
// same-origin call to our backend, which forwards to trezu and hands
// the json array back untouched. a non-2xx or a body that is not a
// json array throws a readable Error.
// ========================================

import { HUGGIES_BASE_URL } from "../stuff/huggies_base_url";
import { HUGGIES_ENDPOINT_PATHS } from "../stuff/huggies_endpoint_paths";
import { huggies_parse_error } from "../stuff/huggies_parse_error";
import type { HUGGIES_TREASURY } from "../types/huggies_treasury";
import type { HUGGIES_TREASURIES_QUERY } from "../types/huggies_treasuries_query";

export async function api_huggies_treasuries_get(
  query: HUGGIES_TREASURIES_QUERY,
): Promise<HUGGIES_TREASURY[]> {
  const account_id = query.accountId.trim();
  if (account_id.length === 0) {
    throw new Error(
      "api_huggies_treasuries_get failed: invalid_account_id: accountId is required and must not be blank",
    );
  }

  const params = new URLSearchParams();
  params.set("accountId", account_id);
  if (query.includeHidden !== undefined) {
    params.set("includeHidden", query.includeHidden ? "true" : "false");
  }

  const url = `${HUGGIES_BASE_URL}${HUGGIES_ENDPOINT_PATHS.api_huggies_treasuries}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const error = await huggies_parse_error(
      response,
      "api_huggies_treasuries_get failed",
    );
    console.log("=============================");
    console.log(" HUGGIES TREASURIES GET FAILED on:", url);
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
      "api_huggies_treasuries_get failed: invalid_response: expected a json array of treasuries",
    );
  }

  console.log("=============================");
  console.log(" HUGGIES TREASURIES GET via GET on:", url);
  console.log(
    "RESPONSE STATUS:",
    `${response.status} - ${response.statusText}`,
  );
  console.log("RESPONSE COUNT:", json.length);
  console.log("=============================");
  return json as HUGGIES_TREASURY[];
}
// ========================================
// copyright 2026 by sleet.near
