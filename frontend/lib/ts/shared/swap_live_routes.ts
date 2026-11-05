// ========================================
// the LIVE ROUTES of the queued swaps on the feed.
//
// the feed shows a queued swap's route on its card, and the card's
// SWAP NOW button signs that route. so the route has to be the route
// the reader can SEE — and the pools move every block, so a route taken
// when the feed loaded is stale.
//
// this module keeps the feed's routes fresh: it asks the router once
// for each swap on screen, and then holds a live subscription per swap
// so every card's route — and the amount out on it — stays current.
//
// --- WHY IT IS SHARED AND NOT IN THE FEED'S FOLDER: the swap page
// needs the same thing for its one swap, and the two must not drift on
// how a route is asked for.
//
// --- WHY THE FEED KEEPS A SUBSCRIPTION PER CARD: each card is its own
// pair and amount, so each is its own query. the router answers one
// query per socket.
//
// --- WHY A FAILED SUBSCRIPTION IS NOT FATAL: the router is a third
// party. the card still shows the route the one-shot fetch gave it,
// and the feed is still a feed.
import { SHIT_1170_SWAP_ROUTES } from "./swap_routes";
import type { SHIT_1170_SWAP_ROUTE } from "./swap_routes";
import { shit_1170_swap_quote_fun } from "./swap_quote";
import type { SHIT_1170_SWAP_QUOTE } from "./swap_quote";
// ========================================
// --- TYPES ------------------------------
// one swap's live routes.
export interface SHIT_1170_SWAP_LIVE_ROUTES {
  // the quote the card shows — the numbers.
  quote: SHIT_1170_SWAP_QUOTE | null;
  // the live routes for this swap, best first.
  routes: ReadonlyArray<SHIT_1170_SWAP_ROUTE>;
}
// ========================================
// --- LOAD ------------------------------
// load the routes for a set of swaps, and hold them live.
//
// --- WHY THE ONE-SHOT FETCH COMES FIRST: the socket takes a moment to
// open and to answer, so the card would show nothing until it does.
// the fetch fills the screen immediately, and the socket takes over.
//
// --- WHY EVERY SWAP IS ASKED FOR ON ITS OWN: the router answers ONE
// pair and ONE amount at a time, so there is no batch call to make.
//
// --- WHY A SWAP THAT FAILS IS ANSWERED WITH NULL AND NOT DROPPED: the
// caller matches the answers to the swaps by index, so a hole in the
// array would shift every answer after it.
export async function shit_1170_swap_live_routes_load_fun(
  swaps: ReadonlyArray<{
    token_in: string;
    token_out: string;
    amount_in: string;
  }>,
  trader_account_id: string | null,
  on_update: (index: number, routes: SHIT_1170_SWAP_ROUTE[]) => void,
): Promise<ReadonlyArray<SHIT_1170_SWAP_LIVE_ROUTES>> {
  const loaded = await Promise.all(
    swaps.map(async (swap) => {
      try {
        const quote = await shit_1170_swap_quote_fun(
          swap.token_in,
          swap.token_out,
          swap.amount_in,
        );
        // --- WHY --- THE ROUTE IS MAPPED AND NOT KEPT RAW: the card
        // shows the route's amounts and the button signs its raw form.
        // the mapped route carries both, so the card and the button
        // read the same route.
        const routes =
          quote?.route === null || quote?.route === undefined
            ? []
            : [SHIT_1170_SWAP_ROUTES.map(quote.route)];
        return { quote, routes };
      } catch (err) {
        console.warn("[swap_live_routes] a route could not be taken", err);
        return { quote: null, routes: [] };
      }
    }),
  );

  // --- WHY THE SUBSCRIPTIONS ARE OPENED AFTER THE FETCH: the card
  // already has a route to show, and the socket is the thing that keeps
  // it fresh. opening them first would mean two live answers for one
  // query.
  for (let index = 0; index < swaps.length; index++) {
    const swap = swaps[index];
    if (swap === undefined) continue;
    const amount = swap.amount_in.trim();
    if (amount.length === 0 || amount === "0") continue;
    void SHIT_1170_SWAP_ROUTES.subscribe(
      swap.token_in,
      swap.token_out,
      amount,
      "in",
      trader_account_id,
      (routes) => {
        on_update(index, routes);
      },
      (message) => {
        console.warn("[swap_live_routes] the subscription failed", message);
      },
    );
  }

  return loaded;
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_SWAP_LIVE_ROUTES = {
  load: shit_1170_swap_live_routes_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
