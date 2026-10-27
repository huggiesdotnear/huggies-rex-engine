// ========================================
// order a token list by the chosen sort field and direction.
//
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
//
// --- WHY --- the sort is applied to ONE PAGE now, not to the whole
// token set. the api sorts and paginates on its own, so the rows
// arrive already ordered by the chosen field, and this function only
// has to put the favourites on top for the `default` view. ordering
// the whole set in javascript would need the whole set downloaded,
// which is exactly what the server-side paging avoids.
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./app_page_discover_token_result";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT,
} from "./app_page_discover_token_sort";
import { HUGGIES_PINNED_TOKENS } from "./app_page_discover_pinned_tokens";
// ========================================
// the order the favourites take among themselves.
function pinned_order_fun(): Map<string, number> {
  const order = new Map<string, number>();
  HUGGIES_PINNED_TOKENS.forEach((entry, index) => {
    order.set(entry.id, entry.weight * 1000 + index);
  });
  return order;
}
// ========================================
// put the favourites on top of a page, in their own order.
//
// only the `default` view has a favourites block. every other sort is
// strict: the rows arrive from the api already in the chosen order,
// and they are returned untouched.
//
// --- WHY --- there is no direction here. the api sorts the page by the
// chosen field and direction, so the rows are already ordered when
// they arrive. this function only has to lift the favourites to the
// top for the `default` view, and that block has its own order.
//
// --- WHY --- a favourite that is not in this page is simply not
// pinned here. the pinned rows are fetched on their own and passed in
// separately, so this only has to order what it is given.
export function order_discover_tokens_fun(
  tokens: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
  sort: HUGGIES_TOKEN_SORT = HUGGIES_DEFAULT_TOKEN_SORT,
): HUGGIES_TOKEN_SEARCH_RESULT[] {
  if (sort !== "default") return [...tokens];
  const order = pinned_order_fun();
  const pinned = tokens.filter((token) => order.has(token.id));
  const rest = tokens.filter((token) => !order.has(token.id));
  pinned.sort((a, b) => {
    const a_pin = order.get(a.id) ?? 0;
    const b_pin = order.get(b.id) ?? 0;
    if (a_pin !== b_pin) return a_pin - b_pin;
    return a.id.localeCompare(b.id);
  });
  return [...pinned, ...rest];
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
