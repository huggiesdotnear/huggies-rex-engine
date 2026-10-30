// ========================================
// order a token list by the chosen sort field and direction.
//
// --- WHY --- there are two kinds of order here, and the sort key picks
// between them:
//
//   * `default` — our favourite tokens lead, then everything else by
//     volume. the landing view: a reader who opens the page sees the
//     tokens we care about, not a wall of bridge tokens.
//   * `volume` / `market cap` — a STRICT sort over every token. no
//     favourites block, no exceptions.
//
// the earlier versions each got one half of this wrong. pinning the
// favourites unconditionally meant the strict sorts never applied; dropping
// the pin entirely meant the favourites were never visible near the top.
// `default` gives the reader both.
//
// --- WHY --- the sort is applied to ONE PAGE now. the api sorts and
// paginates on its own, so the rows arrive already ordered.
//
// --- WHY --- this module is the ONLY place that puts the favourites on
// top. the loader (app_page_discover.ts) fetches the favourite ROWS,
// because the api cannot sort by "our favourites"; where those rows sit
// is decided here, and here alone. the two used to overlap — the loader
// put the favourites on top AND this module lifted them again — and the
// overlap showed a favourite twice once a later page of the list carried
// the same token.
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./app_page_discover_token_result";
import {
  HUGGIES_DEFAULT_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT,
} from "./app_page_discover_token_sort";
import { HUGGIES_PINNED_TOKENS } from "./app_page_discover_pinned_tokens";
// ========================================
// --- MARKED -----------------------------
// the marked tokens and their weight, built ONCE when the module loads.
//
// --- WHY --- the marked list is a constant, so this map is a constant
// too. it is not rebuilt on every render: the order of the marked block
// must not drift between renders or between pages.
const HUGGIES_MARKED_WEIGHT: Map<string, number> = new Map(
  HUGGIES_PINNED_TOKENS.map((entry) => [entry.id, entry.weight]),
);
// ========================================
// ========================================
// put the favourites on top of a page, in their own order.
//
// only the `default` view has a favourites block. every other sort is
// strict: the rows arrive from the api already in the chosen order.
//
// --- WHY --- there is no direction here. the api sorts the page by the
// chosen field and direction, so the rows arrive already ordered. this
// function only has to lift the favourites to the top for the `default`
// view, and that block has its own order.
//
// --- WHY --- a favourite that is not in this page is simply not pinned
// here. the pinned rows are fetched on their own and passed in
// separately.
//
// --- WHY --- the rows are de-duplicated first. a favourite is fetched by
// id AND it can also be on a later page of the list, so the same token
// can arrive twice. showing it twice is a duplicate row, and lifting
// both copies to the top is a double pin.
export function order_discover_tokens_fun(
  tokens: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
  sort: HUGGIES_TOKEN_SORT = HUGGIES_DEFAULT_TOKEN_SORT,
): HUGGIES_TOKEN_SEARCH_RESULT[] {
  const seen = new Set<string>();
  const unique: HUGGIES_TOKEN_SEARCH_RESULT[] = [];
  for (const token of tokens) {
    if (seen.has(token.id)) continue;
    seen.add(token.id);
    unique.push(token);
  }
  if (sort !== "default") return unique;
  const pinned = unique.filter((token) => HUGGIES_MARKED_WEIGHT.has(token.id));
  const rest = unique.filter((token) => !HUGGIES_MARKED_WEIGHT.has(token.id));
  pinned.sort((a, b) => {
    const a_weight = HUGGIES_MARKED_WEIGHT.get(a.id) ?? 0;
    const b_weight = HUGGIES_MARKED_WEIGHT.get(b.id) ?? 0;
    // the lowest weight leads the block.
    if (a_weight !== b_weight) return a_weight - b_weight;
    // --- WHY --- two marked tokens with the same weight are ordered by
    // their OWN id. it is not the position of the entry in the marked
    // list and it is not the position of the row in the rows that came
    // in, so the block is the same on every page and on every render.
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return [...pinned, ...rest];
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
