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
  AMOUNT_OUT,
  GET_ROUTES,
  SUBSCRIBE_ROUTES,
  default_socket_factory,
  type QUOTE_PARAMS,
  type ROUTE,
  type ROUTE_SUBSCRIPTION,
  type SUBSCRIPTION_SOCKET,
} from "@sleet-js/intear-dex-aggregator-tool-box";
import { HUGGIES_SWAP_AGGREGATOR } from "./app_page_swap_aggregator";
import { router_token_id_fun } from "./app_page_swap_router_token";
import type { HUGGIES_SWAP_AMOUNT_SIDE } from "./app_page_swap_amount_side";
// ========================================
// ========================================
// --- TYPES ------------------------------
// one route, as the page shows it.
export interface HUGGIES_SWAP_ROUTE {
  // which dex serves this route: "Rhea", "RheaDcl", "Plach", "Wrap".
  dex_id: string;
  // the quoted output amount, in the output token's smallest unit.
  amount_out: string;
  // the quoted input amount, in the input token's smallest unit. it is
  // only there for an "amount out" quote, where the router answers how
  // much the wanted output costs.
  amount_in: string;
  // the minimum guaranteed output after slippage, in the same unit.
  worst_case_out: string;
  // the minimum guaranteed input after slippage, in the input token's
  // smallest unit. it is only there for an "amount out" quote.
  worst_case_in: string;
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
// the input amount of a route, whichever field the quote carries.
//
// --- WHY --- a quote answers with `amount_in` for an amount_out
// request, and the page needs it to fill the input box when the reader
// fixes the output side. a route that answered the other way is still
// a route, so it is read rather than dropped.
function route_amount_in_fun(route: ROUTE): string {
  const estimated = route.estimated_amount.amount_in;
  if (typeof estimated === "string" && estimated.length > 0) return estimated;
  const worst = route.worst_case_amount.amount_in;
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
// the worst-case input of a route, in the input token's smallest unit.
//
// --- WHY --- the "MIN" line needs one too: when the reader fixes the
// output side, the number on the card is what the swap COSTS, and its
// floor is the worst case of the INPUT amount. reading the output's
// worst case there would show a number in the wrong token.
function route_worst_case_in_fun(route: ROUTE): string {
  const worst = route.worst_case_amount.amount_in;
  if (typeof worst === "string" && worst.length > 0) return worst;
  return route_amount_in_fun(route);
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
    amount_in: route_amount_in_fun(route),
    worst_case_out: route_worst_case_out_fun(route),
    worst_case_in: route_worst_case_in_fun(route),
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
  amount: string,
  side: HUGGIES_SWAP_AMOUNT_SIDE,
  trader_account_id: string | null,
): QUOTE_PARAMS {
  const token_in_id = router_token_id_fun(token_in);
  const token_out_id = router_token_id_fun(token_out);
  const params =
    side === "in"
      ? AMOUNT_IN(token_in_id, token_out_id, amount)
      : AMOUNT_OUT(token_in_id, token_out_id, amount);
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
  amount: string,
  side: HUGGIES_SWAP_AMOUNT_SIDE,
  trader_account_id: string | null,
): Promise<HUGGIES_SWAP_ROUTE[]> {
  const params = build_quote_params_fun(
    token_in,
    token_out,
    amount,
    side,
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
// how long a close waits for a socket to finish connecting before it
// closes it anyway. a socket that cannot open must not hold the page
// up, and a socket that opens quickly never waits at all.
const HUGGIES_CLOSE_WAIT_MS = 1500;
// how often the close checks whether the socket has finished
// connecting.
//
// --- WHY --- it is a POLL and not a callback: the tool box sets
// `socket.onopen` itself, so a handler the page sets is overwritten.
const HUGGIES_CLOSE_POLL_MS = 50;
// the WebSocket readyState that means "the handshake has not finished".
//
// --- WHY --- it is written out and not read off the socket: the number
// is part of the WebSocket standard, and the tool box's own `close()`
// already compares against the same value for the OPEN state.
const SOCKET_CONNECTING = 0;
// ========================================
// the subscription the page currently holds, so it can be closed.
let current_subscription: ROUTE_SUBSCRIPTION | null = null;
// the newest subscribe's number.
//
// --- WHY --- it exists: a subscribe is opened with an `await`, and the
// socket is created before that await resolves. two subscribes can
// therefore overlap, and the older one can land AFTER the newer one.
// this counter says which one is the newest, so the older one closes
// itself on arrival instead of taking over.
let generation = 0;
// ========================================
// the socket the current subscription is using.
//
// --- WHY --- IT IS TRACKED HERE: the tool box's subscription does not
// expose its socket, so the page cannot tell whether the socket has
// finished connecting. it matters: closing a socket that is still
// CONNECTING makes the browser log "WebSocket is closed before the
// connection is established" and report it as an error.
//
// the tool box takes a socket factory, so the page supplies its own and
// keeps the socket it hands over.
let current_socket: SUBSCRIPTION_SOCKET | null = null;
// ========================================
// close the live subscription, if there is one.
//
// --- WHY --- closing is safe to call when there is no subscription: the
// page opens and closes these as the reader changes the swap, and a
// close on an already-closed page must not throw.
//
// --- WHY --- THE CLOSE WAITS FOR THE SOCKET TO OPEN: closing a socket
// that is still connecting makes the browser log the warning above and
// report it as an error — an error the reader caused by typing one more
// digit, because every keystroke opens a new socket and closes the old
// one, and the old one is usually still connecting.
function close_swap_subscription_fun(): void {
  if (current_subscription === null) return;
  const subscription = current_subscription;
  current_subscription = null;
  current_socket = null;
  close_when_open_fun(subscription, current_socket);
}
// ========================================
// close a subscription, but only once its socket has finished
// connecting.
//
// --- WHY --- THE WAIT: a socket that is still CONNECTING must not be
// closed, or the browser logs "WebSocket is closed before the
// connection is established" as an error. so the close waits for the
// socket to open, and then closes it.
//
// --- WHY --- THE TIMEOUT: a socket that never opens — the network is
// down, the server refuses it — must not leave the old subscription
// running forever.
function close_when_open_fun(
  subscription: ROUTE_SUBSCRIPTION,
  socket: SUBSCRIPTION_SOCKET | null,
): void {
  const close_now_fun = () => {
    try {
      subscription.close();
    } catch (err) {
      console.warn("[swap] closing the route subscription failed", err);
    }
  };
  if (socket === null) {
    close_now_fun();
    return;
  }
  // the socket is already open, or already gone. either way there is
  // nothing to wait for.
  if (socket.readyState !== SOCKET_CONNECTING) {
    close_now_fun();
    return;
  }
  // --- WHY --- THE READY STATE IS POLLED AND NOT A CALLBACK: the tool
  // box sets `socket.onopen` itself, so a handler set here would be
  // overwritten and never called. the readyState is the only thing the
  // page can still read.
  //
  // --- WHY --- THE POLL STOPS EARLY: the socket is closed as soon as
  // it is no longer connecting, so the poll does not keep running for
  // the life of the socket.
  const started_at = Date.now();
  const timer = setInterval(() => {
    const still_connecting = socket.readyState === SOCKET_CONNECTING;
    const out_of_time = Date.now() - started_at >= HUGGIES_CLOSE_WAIT_MS;
    if (still_connecting && !out_of_time) return;
    clearInterval(timer);
    close_now_fun();
  }, HUGGIES_CLOSE_POLL_MS);
}
// ========================================
// open a live subscription for one swap, replacing any open one.
//
// --- WHY --- THE GENERATION COUNTER: a subscription is opened with an
// `await`, and the socket is created BEFORE that await resolves. so a
// second subscribe can start while the first one is still in flight,
// and the first one's subscription would land AFTER the second one and
// overwrite it. the counter says which subscribe is the newest, and a
// subscription that lands for an older generation is closed on arrival
// instead of taking over.
//
// --- WHY --- THE SOCKET IS NOT CLOSED WHILE IT IS STILL CONNECTING:
// closing a socket that has not finished its handshake makes the
// browser log "WebSocket is closed before the connection is
// established" and report it as an error. the reader sees that error
// every time they type another digit, because every keystroke opens a
// new socket and closes the old one, and the old one is usually still
// connecting. so the close WAITS for the socket to have opened.
//
// --- WHY --- THE OLD SUBSCRIPTION IS CLOSED FIRST: the socket is
// bound to one query, so an old socket answering the old query would
// push stale routes over the fresh ones.
async function subscribe_swap_routes_fun(
  token_in: string,
  token_out: string,
  amount: string,
  side: HUGGIES_SWAP_AMOUNT_SIDE,
  trader_account_id: string | null,
  on_routes: (routes: HUGGIES_SWAP_ROUTE[]) => void,
  on_error: (message: string) => void,
): Promise<void> {
  // this subscribe is the newest one from now on.
  generation += 1;
  const my_generation = generation;
  // the subscription we are about to open, and the socket it uses.
  const previous_subscription = current_subscription;
  const previous_socket = current_socket;
  current_subscription = null;
  current_socket = null;
  if (previous_subscription !== null) {
    close_when_open_fun(previous_subscription, previous_socket);
  }
  const params = build_quote_params_fun(
    token_in,
    token_out,
    amount,
    side,
    trader_account_id,
  );
  // the socket this subscribe hands to the tool box, so the page can
  // tell whether it has finished connecting.
  let socket: SUBSCRIPTION_SOCKET | null = null;
  let subscription: ROUTE_SUBSCRIPTION;
  try {
    subscription = await SUBSCRIBE_ROUTES(
      HUGGIES_SWAP_AGGREGATOR.client,
      params,
      {
        id: HUGGIES_SWAP_SUBSCRIPTION_ID,
        // --- WHY --- THE FACTORY: the tool box's subscription does not
        // expose its socket, and the page needs the socket's readyState
        // to close it quietly. the factory hands the socket over.
        socket_factory: (url: string) => {
          socket = default_socket_factory(url);
          return socket;
        },
        on_update: (update) => {
          if (update.kind === "error") {
            // --- WHY --- an invalid query answers IN BAND and leaves the
            // socket open, so this is a message about this query, not
            // a dead socket. the one-shot fetch below says the same
            // thing, so it is not shown twice.
            console.info(
              "[swap] the route subscription reported",
              update.message,
            );
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
    return;
  }
  // --- WHY --- THE GENERATION IS CHECKED AGAIN: a newer subscribe may
  // have started while this one was opening. if so, this subscription
  // is already stale, and it is closed on arrival rather than left to
  // answer a question nobody is asking.
  if (my_generation !== generation) {
    close_when_open_fun(subscription, socket);
    return;
  }
  current_subscription = subscription;
  current_socket = socket;
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
