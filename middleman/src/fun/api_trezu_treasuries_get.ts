// ========================================
// API_TREZU_TREASURIES_GET
// GET /api/trezu/user/treasuries — the treasuries (sputnik daos) an
// account belongs to, proxied through our own backend to trezu.
//
// same-origin call to our backend, which forwards to trezu and hands
// the json array back untouched. a non-2xx or a body that is not a
// json array throws a readable Error.
// ========================================

import { api_call } from "../stuff/api_call";
import type { TREZU_TREASURY } from "../types/trezu_treasury";
import type { TREZU_TREASURIES_QUERY } from "../types/trezu_treasuries_query";

export async function api_trezu_treasuries_get(
  base_url: string,
  query: TREZU_TREASURIES_QUERY,
): Promise<TREZU_TREASURY[]> {
  const account_id = query.accountId.trim();
  if (account_id.length === 0) {
    throw new Error(
      "api_trezu_treasuries_get failed: invalid_account_id: accountId is required and must not be blank",
    );
  }

  const json = await api_call<TREZU_TREASURY[]>({
    base_url,
    key: "api_trezu_treasuries",
    query: {
      accountId: account_id,
      includeHidden: query.includeHidden,
    },
    method: "GET",
    label: "TREZU TREASURIES GET",
    fallback: "api_trezu_treasuries_get failed",
  });

  if (!Array.isArray(json)) {
    throw new Error(
      "api_trezu_treasuries_get failed: invalid_response: expected a json array of treasuries",
    );
  }

  return json;
}
// ========================================
// copyright 2026 by sleet.near
