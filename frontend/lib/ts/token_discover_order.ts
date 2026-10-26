// ========================================
// order a token list by the chosen sort field and direction.
// ========================================
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./token_search";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
  token_sort_field_fun,
  type HUGGIES_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT_DIRECTION,
} from "./token_sort";
import { HUGGIES_PINNED_TOKENS } from "./pinned_tokens";
// ========================================
// order a token list by the chosen field and direction.
// --- WHY --- there are two kinds of order here, and the sort key picks
// between them:
//
//   * `default` — our favourite tokens lead, then everything else by
//     volume. this is the landing view: a reader who opens the page
//     sees the tokens we care about, not a wall of bridge tokens.
//   * `volume` / `market cap` — a STRICT sort over every token. no
//     favourites block, no exceptions.
//
// the earlier versions each got one half of this wrong. pinning the
// favourites unconditionally meant the strict sorts never really
// applied; dropping the pin entirely meant the favourites were never
// visible near the top. `default` is the third option that gives the
// reader both: the default view has the favourites, and choosing a
// sort gives them a sort that is actually a sort.
export function order_discover_tokens_fun(
  tokens: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
  sort: HUGGIES_TOKEN_SORT = HUGGIES_DEFAULT_TOKEN_SORT,
  direction: HUGGIES_TOKEN_SORT_DIRECTION =
    HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
): HUGGIES_TOKEN_SEARCH_RESULT[] {
  const field = token_sort_field_fun(sort);
  const sign = direction === "asc" ? 1 : -1;
  // the favourites block only exists in the default view.
  const pin_order = new Map<string, number>();
  if (sort === "default") {
    HUGGIES_PINNED_TOKENS.forEach((entry, index) => {
      pin_order.set(entry.id, entry.weight * 1000 + index);
    });
  }
  return [...tokens].sort((a, b) => {
    const a_pin = pin_order.get(a.id);
    const b_pin = pin_order.get(b.id);
    if (a_pin !== undefined || b_pin !== undefined) {
      if (a_pin === undefined) return 1;
      if (b_pin === undefined) return -1;
      if (a_pin !== b_pin) return a_pin - b_pin;
    }
    const delta = (a[field] - b[field]) * sign;
    if (delta !== 0) return delta;
    // a stable tiebreak, so equal values keep a fixed order instead of
    // shuffling on every re-render.
    return a.id.localeCompare(b.id);
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
