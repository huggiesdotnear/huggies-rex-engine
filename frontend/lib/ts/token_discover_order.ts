// ========================================
// order discover tokens by the requested volume field and spotlight ids.
// ========================================
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./token_search";
import { emoji_token_entries_fun } from "./emoji_token_entries";
// ========================================
// order one page of tokens by volume and keep spotlight tokens first.
export function order_discover_tokens_fun(
  tokens: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
  volume_field: "volume_usd_24h" = "volume_usd_24h",
): HUGGIES_TOKEN_SEARCH_RESULT[] {
  const spotlight_ids = new Set(
    emoji_token_entries_fun().map((entry) => entry.token_id),
  );
  return [...tokens].sort((a, b) => {
    const spotlight_delta =
      Number(spotlight_ids.has(b.id)) - Number(spotlight_ids.has(a.id));
    if (spotlight_delta !== 0) return spotlight_delta;
    return b[volume_field] - a[volume_field];
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
