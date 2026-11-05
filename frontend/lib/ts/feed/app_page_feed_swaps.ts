// ========================================
// the feed page's SWAPS.
//
// the feed holds two kinds of post: a queued BATCH of transactions, and
// a queued SWAP. the swap has no calls yet — the agent named a token in,
// an amount in and a token out — so the feed asks the swap queue for
// those, and asks the router for the live route.
//
// --- WHY THE SWAPS ARE A SEPARATE FILE AND NOT IN THE FEED'S LOADER:
// the feed's loader fetches the QUEUES. the swaps are a different
// resource with a different shape, and mixing the two would make the
// loader do two jobs.
//
// --- WHY THE TOKENS ARE ASKED FOR IN ONE CALL: a feed of ten swaps can
// name the same token twice, and one request for the set is one request
// and not ten.
//
// --- WHY THE ROUTES ARE LOADED HERE AND NOT IN A COMPONENT: a component
// that fetches is a component that can fetch at the wrong time, and the
// feed's rule is that the components only display. so the routes come
// with the load.
import {
  api_shit_1170_swap_queue_get,
  type SHIT_1170_SWAP_QUEUE,
  type SHIT_1170_SWAP_QUEUE_QUERY,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import { fetch_transfer_tokens_by_ids_fun } from "../shared/transfer_tokens";
import { SHIT_1170_SWAP_LIVE_ROUTES } from "../shared/swap_live_routes";
import { SHIT_1170_SWAP_BALANCES } from "../shared/swap_balances";
import type { SHIT_1170_SWAP_QUOTE } from "../shared/swap_quote";
import type { SHIT_1170_SWAP_ROUTE } from "../shared/swap_routes";
import type { SHIT_1170_TRANSFER_TOKEN } from "../shared/transfer_tokens";
// ========================================
// --- TYPES ------------------------------
// what one load of the swaps brings back.
export interface SHIT_1170_APP_PAGE_FEED_SWAPS_LOADED {
  // the queued swaps on screen.
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>;
  // the token metadata for the two tokens each swap names.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  // the live quote of each swap, in the SAME order as `swaps`. an entry
  // is null when the router could not answer.
  quotes: ReadonlyArray<SHIT_1170_SWAP_QUOTE | null>;
  // the live routes of each swap, in the SAME order as `swaps`. the
  // SWAP NOW button signs the BEST route of the swap, and this is
  // where it finds it.
  routes: ReadonlyArray<ReadonlyArray<SHIT_1170_SWAP_ROUTE>>;
  // the reader's balance of each token a swap SELLS, keyed by token id.
  // the SWAP NOW button is off when the balance does not cover the
  // amount, so the reader is never offered a trade they cannot make.
  balances: Map<string, string>;
  // how many swaps the WHOLE match holds, before the cursor took its
  // cut.
  total: number;
  // the cursor of the NEXT page, or null when this page is the last
  // one.
  next_cursor: string | null;
}
// ========================================
// --- CONFIG -----------------------------
// how many swaps the feed asks for.
//
// --- WHY --- it is a hundred and not fifty: the feed pages by cursor
// and asks for the next page when the reader nears the bottom, so a
// hundred is two screens of work for one request.
const SHIT_1170_FEED_SWAP_LIMIT = 100;
// ========================================
// ========================================
// --- QUERY -----------------------------
// the query the feed's filter makes for the swaps.
//
// --- WHY THE SWAPS CARRY THE CONTRACT FILTER: a queued swap's
// `tokenIn` and `tokenOut` ARE contract ids, so the api can match a
// swap when EITHER side of the trade is one of the picked contracts.
// without it the contracts group would narrow the batches and leave
// every swap on screen.
//
// --- WHY `account_id` IS THE PICKED ACCOUNTS LIST: the api reads ONE
// comma separated value and reads the values as an OR, so the reader's
// picked accounts go out as the one string.
//
// --- WHY THE CURSOR GOES OUT UNTOUCHED: it is the backend's own opaque
// page point, and only the backend can read it back.
export function shit_1170_feed_swaps_query_fun(
  account_id: string | null,
  hide_sent: boolean,
  contracts: string | null,
  cursor: string | null,
): SHIT_1170_SWAP_QUEUE_QUERY {
  const query: SHIT_1170_SWAP_QUEUE_QUERY = {
    limit: SHIT_1170_FEED_SWAP_LIMIT,
  };
  if (contracts !== null) query.contract_id = contracts;
  if (cursor !== null) query.cursor = cursor;
  if (account_id === null) return query;
  query.account_id = account_id;
  if (hide_sent) query.hide_sent = true;
  return query;
}
// ========================================
// ========================================
// --- LOAD ------------------------------
// load the queued swaps, their tokens and their live routes.
//
// --- WHY A FAILED ROUTE LOAD DOES NOT FAIL THE LOAD: the router is a
// third party. the swaps are still worth showing without their live
// numbers, because the backend's stored quote is the fallback.
//
// --- WHY THE API KEY AND THE TRADER ACCOUNT ARE THE READER'S OWN: the
// picked accounts are a comma separated LIST and a key belongs to ONE
// account, so asking for the key of the list finds nothing and the call
// goes out with no key at all. the reader's own account is what the
// backend takes for the `hide_sent` filter, and what the router plans
// the trade for.
export async function shit_1170_feed_swaps_load_fun(
  account_id: string | null,
  hide_sent: boolean,
  contracts: string | null,
  cursor: string | null,
  on_routes: (index: number, routes: SHIT_1170_SWAP_ROUTE[]) => void,
): Promise<SHIT_1170_APP_PAGE_FEED_SWAPS_LOADED> {
  const own_account_id = SHIT_1170_AUTH.get_account_id();
  const options = await api_key_options_fun(false, own_account_id ?? undefined);
  const result = await api_shit_1170_swap_queue_get(
    SHIT_1170_BASE_URL,
    shit_1170_feed_swaps_query_fun(account_id, hide_sent, contracts, cursor),
    options,
  );
  const swaps = result.items;
  const tokens = await load_swap_tokens_fun(swaps);
  const balances = await load_swap_balances_fun(swaps, own_account_id);
  const live = await load_swap_routes_fun(swaps, own_account_id, on_routes);
  return {
    swaps,
    tokens,
    quotes: live.map((one) => one.quote),
    routes: live.map((one) => one.routes),
    balances,
    total: result.total,
    next_cursor: result.nextCursor,
  };
}
// ========================================
// --- TOKENS ----------------------------
// the token metadata for the tokens the swaps name.
//
// --- WHY A FAILURE HERE IS SWALLOWED: the swaps are still worth showing
// without their icons. a failure here costs the reader the icon and the
// symbol, and it must not cost them the feed.
async function load_swap_tokens_fun(
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>,
): Promise<Map<string, SHIT_1170_TRANSFER_TOKEN>> {
  const ids: string[] = [];
  for (const swap of swaps) {
    ids.push(swap.tokenIn, swap.tokenOut);
  }
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  try {
    return await fetch_transfer_tokens_by_ids_fun(unique);
  } catch (err) {
    console.warn(
      "[app_page_feed_swaps] the token metadata could not be read",
      err,
    );
    return new Map();
  }
}
// ========================================
// --- BALANCES --------------------------
// the reader's balance of the tokens the swaps sell.
//
// --- WHY ONLY THE TOKEN IN: the token in is the one that LEAVES the
// reader's wallet, so it is the one the balance has to cover. the token
// out is what comes back.
//
// --- WHY THE ACCOUNT IS THE READER'S OWN: a balance belongs to a
// wallet, and the wallet in play is the reader's. the picked accounts
// are the queues being looked at and not the wallets being spent from.
//
// --- WHY THE SIGNED-OUT READER GETS NO BALANCES: there is no account,
// so there is nothing to check.
//
// --- WHY A FAILURE HERE IS SWALLOWED: the swaps are still worth
// showing. a balance the app could not read costs the reader the
// balance check, and it must not cost them the feed.
async function load_swap_balances_fun(
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>,
  account_id: string | null,
): Promise<Map<string, string>> {
  if (account_id === null) return new Map();
  const ids = [...new Set(swaps.map((swap) => swap.tokenIn))];
  if (ids.length === 0) return new Map();
  try {
    const balances = await SHIT_1170_SWAP_BALANCES.load(account_id, ids);
    return new Map(balances);
  } catch (err) {
    console.warn("[app_page_feed_swaps] the balances could not be read", err);
    return new Map();
  }
}
// ========================================
// --- ROUTES ----------------------------
// the live routes of the swaps.
//
// --- WHY THE TRADER ACCOUNT IS PASSED: the router plans the
// storage-deposit legs for the account that is going to trade, so the
// route it answers can actually be executed. the reader may not be the
// one who presses SWAP NOW, but the route is planned for whoever is
// signed in — the reader's own account, and not the accounts they are
// looking at.
//
// --- WHY THE ROUTES ARE ASKED FOR ALL AT ONCE: a feed of fifty swaps
// is fifty questions to the router, and they are asked together so the
// answers come back together.
async function load_swap_routes_fun(
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>,
  account_id: string | null,
  on_routes: (index: number, routes: SHIT_1170_SWAP_ROUTE[]) => void,
): Promise<
  ReadonlyArray<{
    quote: SHIT_1170_SWAP_QUOTE | null;
    routes: ReadonlyArray<SHIT_1170_SWAP_ROUTE>;
  }>
> {
  if (swaps.length === 0) return [];
  try {
    return await SHIT_1170_SWAP_LIVE_ROUTES.load(
      swaps.map((swap) => ({
        token_in: swap.tokenIn,
        token_out: swap.tokenOut,
        amount_in: swap.amountIn,
      })),
      account_id,
      on_routes,
    );
  } catch (err) {
    console.warn(
      "[app_page_feed_swaps] the live routes could not be taken",
      err,
    );
    return swaps.map(() => ({ quote: null, routes: [] }));
  }
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_SWAPS = {
  load: shit_1170_feed_swaps_load_fun,
  query: shit_1170_feed_swaps_query_fun,
};
// ========================================
// copyright 2026 by sleet.near
