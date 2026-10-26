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
import { HUGGIES_PINNED_TOKENS } from "./pinned_tokens";
// ========================================
// order a token list by the chosen field and direction.
// --- WHY --- the pinned tokens come first, and everything else follows
// the chosen sort strictly. the pinned block is a short, deliberate
// list (see pinned_tokens.ts) rather than every token the emojifi
// project lists: an earlier version pinned all of them, including
// test tokens, which meant the list never followed the chosen sort at
// all — a pinned token with tiny volume sat above the biggest one.
export function order_discover_tokens_fun(
  tokens: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
  sort: HUGGIES_TOKEN_SORT = HUGGIES_DEFAULT_TOKEN_SORT,
  direction: HUGGIES_TOKEN_SORT_DIRECTION =
    HUGGIES_DEFAULT_TOKEN_SORT_DIRECTION,
): HUGGIES_TOKEN_SEARCH_RESULT[] {
  // the pinned tokens, ordered by their own weight, so our own token
  // leads the block and the rest keep a fixed order under it.
  const pin_order = new Map<string, number>();
  HUGGIES_PINNED_TOKENS.forEach((entry, index) => {
    pin_order.set(entry.id, entry.weight * 1000 + index);
  });
  const sign = direction === "asc" ? 1 : -1;
  return [...tokens].sort((a, b) => {
    // the pinned block always leads, regardless of direction.
    const a_pin = pin_order.get(a.id);
    const b_pin = pin_order.get(b.id);
    if (a_pin !== undefined || b_pin !== undefined) {
      if (a_pin === undefined) return 1;
      if (b_pin === undefined) return -1;
      if (a_pin !== b_pin) return a_pin - b_pin;
    }
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
