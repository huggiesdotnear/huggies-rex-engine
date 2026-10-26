// ========================================
// order a token list by the chosen sort field and direction.
// ========================================
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./token_search";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
  type HUGGIES_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT_DIRECTION,
} from "./token_sort";
// ========================================
// order a token list by the chosen field and direction.
// --- WHY --- the sort is absolute: every token is placed by the chosen
// field, with no pinned block in front of it. the pinned tokens are
// still marked (see pinned_tokens.ts) so the ui can style them, but
// they do not override the order — a reader who picks a sort wants
// that sort, not our favourites on top of it. this also undoes the
// earlier behaviour where a pinned token with tiny volume sat above
// the biggest one, and no direction could fix it.
export function order_discover_tokens_fun(
  tokens: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
  sort: HUGGIES_TOKEN_SORT = HUGGIES_DEFAULT_TOKEN_SORT,
  direction: HUGGIES_TOKEN_SORT_DIRECTION =
    HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
): HUGGIES_TOKEN_SEARCH_RESULT[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...tokens].sort((a, b) => {
    const delta = (a[sort] - b[sort]) * sign;
    if (delta !== 0) return delta;
    // a stable tiebreak, so equal values keep a fixed order instead of
    // shuffling on every re-render.
    return a.id.localeCompare(b.id);
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
