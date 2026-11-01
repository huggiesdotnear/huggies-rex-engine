// ========================================
// the swap page's ROUTES: the dex-aggregator's answers for one swap.
//
// there are two ways to get routes and the page uses BOTH:
//
//   GET_ROUTES     one answer, right now. used when the reader first
//                  opens the page and when they change a token or the
//                  amount.
//   SUBSCRIBE_ROUTES  a live socket. the pools move every block, so a
//                  quote is only good for a few seconds. the socket
//                  pushes a fresh best-first list every time a pool
//                  change moves the result, so the reader's amount out
//                  stays live without polling.
//
// --- WHY BOTH AND NOT JUST THE SOCKET: the socket takes a moment to
// open and to answer, so the first render would have nothing on it.
// the one-shot fetch fills the screen immediately, and the socket takes
// over as soon as it opens.
//
// --- WHY THE SUBSCRIPTION IS CLOSED AND REOPENED ON EVERY CHANGE: the
// socket is bound to ONE query — one token pair, one amount. when the
// reader changes any of those, the old socket is answering a question
// nobody is asking any more, so it is closed and a new one opened.
import {
  AMOUNT_IN,
  GET_ROUTES,
  SUBSCRIBE_ROUTES,
  type QUOTE_PARAMS,
  type ROUTE,
  type ROUTE_SUBSCRIPTION,
} from "@sleet-js/intear-dex-aggregator-tool-box";
import { HUGGIES_SWAP_AGGREGATOR } from "./app_page_swap_aggregator";
import { router_token_id_fun } from "./app_page_swap_router_token";
// ========================================
// ========================================
// --- TYPES ------------------------------
// one route, as the page shows it.
export interface HUGGIES_SWAP_ROUTE {
  // which dex serves this route: "Rhea", "RheaDcl", "Plach", "Wrap".
  dex_id: string;
  // the quoted output amount, in the output token's smallest unit.
  amount_out: string;
  // the minimum guaranteed output after slippage, in the same unit.
  worst_case_out: string;
  // how many transactions the route has to send.
  tx_count: number;
  // the route's own output token id, as the router names it.
  token_output: string;
  // the raw route, for the execution step.
  raw: ROUTE;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the output amount of a route, whichever field the quote carries.
//
// --- WHY --- a quote answers with `amount_out` for an amount_in
// request and `amount_in` for an amount_out request. the page quotes
// on the input, so `amount_out` is the one it wants — but a route that
// answered the other way is still a route, so it is read rather than
// dropped.
function route_amount_out_fun(route: ROUTE): string {
  const estimated = route.estimated_amount.amount_out;
  if (typeof estimated === "string" && estimated.length > 0) return estimated;
  const worst = route.worst_case_amount.amount_out;
  if (typeof worst === "string" && worst.length > 0) return worst;
  return "0";
}
// ========================================
// the worst-case output of a route, in the same unit.
function route_worst_case_out_fun(route: ROUTE): string {
  const worst = route.worst_case_amount.amount_out;
  if (typeof worst === "string" && worst.length > 0) return worst;
  return route_amount_out_fun(route);
}
// ========================================
// how many transactions the route sends.
//
// --- WHY --- the fee legs are counted too: they are transactions the
// reader's wallet signs, and a route that sends three transactions
// should not look like one that sends one.
function route_tx_count_fun(route: ROUTE): number {
  return route.execution_instructions.length;
}
// ========================================
// map the router's routes into the page's shape.
function map_routes_fun(routes: ReadonlyArray<ROUTE>): HUGGIES_SWAP_ROUTE[] {
  return routes.map((route) => ({
    dex_id: route.dex_id,
    amount_out: route_amount_out_fun(route),
    worst_case_out: route_worst_case_out_fun(route),
    tx_count: route_tx_count_fun(route),
    token_output: route.token_output,
    raw: route,
  }));
}
// ========================================
// ========================================
// --- PARAMS ----------------------------
// the quote parameters for one swap.
//
// --- WHY --- the trader account is passed when we know it: it lets
// the router plan the storage-deposit legs the swap needs, so the
// route it returns can actually be executed. without it a route may
// be missing a deposit the reader's account does not yet have.
//
// --- WHY --- slippage is left at the package's default (fixed 1%):
// the router's own default, and the package exposes `WITH_FIXED_SLIPPAGE`
// for when the page grows a slippage control.
function build_quote_params_fun(
  token_in: string,
  token_out: string,
  amount_in: string,
  trader_account_id: string | null,
): QUOTE_PARAMS {
  const params = AMOUNT_IN(
    router_token_id_fun(token_in),
    router_token_id_fun(token_out),
    amount_in,
  );
  if (trader_account_id === null) return params;
  return {
    ...params,
    trader_account_id: trader_account_id,
  };
}
// ========================================
// ========================================
// --- GET -------------------------------
// fetch the routes for one swap, once.
async function get_swap_routes_fun(
  token_in: string,
  token_out: string,
  amount_in: string,
  trader_account_id: string | null,
): Promise<HUGGIES_SWAP_ROUTE[]> {
  const params = build_quote_params_fun(
    token_in,
    token_out,
    amount_in,
    trader_account_id,
  );
  const routes = await GET_ROUTES(HUGGIES_SWAP_AGGREGATOR.client, params);
  return map_routes_fun(routes);
}
// ========================================
// ========================================
// --- SUBSCRIBE -------------------------
// open a live subscription for one swap.
//
// --- WHY --- the subscription id is the same for every one of them: each
// call owns its own socket and its own request id, so the id only has
// to be unique WITHIN a socket. a fixed id keeps it simple.
const HUGGIES_SWAP_SUBSCRIPTION_ID = 1;
// ========================================
// the subscription the page currently holds, so it can be closed.
let current_subscription: ROUTE_SUBSCRIPTION | null = null;
// ========================================
// close the live subscription, if there is one.
//
// --- WHY --- closing is safe to call when there is no subscription: the
// page opens and closes these as the reader changes the swap, and a
// close on an already-closed page must not throw.
function close_swap_subscription_fun(): void {
  if (current_subscription === null) return;
  const subscription = current_subscription;
  current_subscription = null;
  try {
    subscription.close();
  } catch (err) {
    console.warn("[swap] closing the route subscription failed", err);
  }
}
// ========================================
// open a live subscription for one swap, replacing any open one.
//
// --- WHY --- the previous subscription is closed FIRST: the socket is
// bound to one query, so an old socket answering the old query would
// push stale routes over the fresh ones.
async function subscribe_swap_routes_fun(
  token_in: string,
  token_out: string,
  amount_in: string,
  trader_account_id: string | null,
  on_routes: (routes: HUGGIES_SWAP_ROUTE[]) => void,
  on_error: (message: string) => void,
): Promise<void> {
  close_swap_subscription_fun();
  const params = build_quote_params_fun(
    token_in,
    token_out,
    amount_in,
    trader_account_id,
  );
  try {
    current_subscription = await SUBSCRIBE_ROUTES(
      HUGGIES_SWAP_AGGREGATOR.client,
      params,
      {
        id: HUGGIES_SWAP_SUBSCRIPTION_ID,
        on_update: (update) => {
          if (update.kind === "error") {
            // --- WHY --- an invalid query answers IN BAND and leaves the
            // socket open, so this is a message about this query, not
            // a dead socket. the one-shot fetch below says the same
            // thing, so it is not shown twice.
            console.info("[swap] the route subscription reported", update.message);
            return;
          }
          on_routes(map_routes_fun(update.routes));
        },
        on_error: (error) => {
          on_error(error.message);
        },
      },
    );
  } catch (err) {
    on_error(err instanceof Error ? err.message : String(err));
  }
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_SWAP_ROUTES = {
  get: get_swap_routes_fun,
  subscribe: subscribe_swap_routes_fun,
  close_subscription: close_swap_subscription_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
