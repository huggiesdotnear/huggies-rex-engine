// ========================================
// the swap page's shared state: the two tokens, the amount, the routes,
// the balances and the error.
//
// the page is split into several components — the swap form, the route
// cards, the token picker — and they all read this one store, so they
// cannot drift apart. the store owns the load, the components display.
//
// --- WHY THE STATE IS ONE OBJECT AND NOT SEVERAL STORES: the pieces
// are ONE view. a route quote is only meaningful for the token pair and
// the amount it was asked about, and the balance belongs to the token
// the card is showing. splitting them into separate stores would let
// one show a route for a pair the others have already moved on from.
import { HUGGIES_APP_PAGE_SWAP_URL } from "./app_page_swap_url";
import { HUGGIES_APP_PAGE_SWAP_BALANCES } from "./app_page_swap_balances";
import { HUGGIES_APP_PAGE_SWAP_ROUTES } from "./app_page_swap_routes";
import { HUGGIES_TOKEN_INFO } from "../shared/token_info";
import { HUGGIES_AUTH } from "../shared/auth_status";
import { HUGGIES_NEAR_ID } from "../shared/token_near";
import { human_to_unit_fun } from "./app_page_swap_amount";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "../shared/token_info";
import type { HUGGIES_SWAP_ROUTE } from "./app_page_swap_routes";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the whole state of the swap page.
export interface HUGGIES_APP_PAGE_SWAP_STATE {
  // the token being sold.
  token_in: string;
  // the token being bought.
  token_out: string;
  // the human amount the reader typed for the token in.
  amount_in: string;
  // the info for the two tokens, once they are known.
  token_in_info: TOKEN_INFO | null;
  token_out_info: TOKEN_INFO | null;
  // the raw balances of the two tokens, in their smallest units.
  balances: ReadonlyMap<string, string>;
  // the routes the aggregator quoted, best first.
  routes: ReadonlyArray<HUGGIES_SWAP_ROUTE>;
  // the route the reader picked, or null when the best one is in use.
  selected_dex_id: string | null;
  // true while a quote is in flight.
  loading_routes: boolean;
  // true while the balances are loading.
  loading_balances: boolean;
  // true while a swap is being sent.
  swapping: boolean;
  // the message for the reader, when something failed.
  error: string | null;
}
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the pair the page opens on.
//
// --- WHY NEAR FOR USDT: the pair the router serves best, and the one
// the app's own tooling knows. the reader picks their own pair with the
// token picker.
const HUGGIES_SWAP_DEFAULT_TOKEN_IN = HUGGIES_NEAR_ID;
const HUGGIES_SWAP_DEFAULT_TOKEN_OUT = "usdt.tether-token.near";
// ========================================
// ========================================
// --- STATE ------------------------------
// the state the page holds.
let state: HUGGIES_APP_PAGE_SWAP_STATE = {
  token_in: HUGGIES_SWAP_DEFAULT_TOKEN_IN,
  token_out: HUGGIES_SWAP_DEFAULT_TOKEN_OUT,
  amount_in: "",
  token_in_info: null,
  token_out_info: null,
  balances: new Map(),
  routes: [],
  selected_dex_id: null,
  loading_routes: false,
  loading_balances: false,
  swapping: false,
  error: null,
};
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// the quote the routes on screen belong to. a route answer for a
// different pair or a different amount must not overwrite them.
let quoted_token_in: string | null = null;
let quoted_token_out: string | null = null;
let quoted_amount_in: string | null = null;
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing cannot break the
// notify.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[app_page_swap_store] listener failed", err);
    }
  }
}
// ========================================
// register a re-render callback; returns an unsubscribe to clean up on
// unmount.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// write the state and tell everyone.
function set_state_fun(next: HUGGIES_APP_PAGE_SWAP_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// --- TOKENS ----------------------------
// the two token ids the page holds, read from the url on the first
// load and kept in step with it after that.
//
// --- WHY --- the url is the source of truth: a swap link says what it
// swaps, so a reader who shares or reloads the page gets the same pair
// back.
function read_tokens_fun(): { token_in: string; token_out: string } {
  const from_url_in = HUGGIES_APP_PAGE_SWAP_URL.read_in();
  const from_url_out = HUGGIES_APP_PAGE_SWAP_URL.read_out();
  return {
    token_in: from_url_in ?? state.token_in,
    token_out: from_url_out ?? state.token_out,
  };
}
// ========================================
// the token infos for the two tokens, and the balances of them.
//
// --- WHY --- the balances come FIRST: they decide whether the swap
// button is enabled, and a button that cannot be pressed is a worse
// first impression than a token's price arriving a moment later.
async function load_tokens_and_balances_fun(
  token_in: string,
  token_out: string,
): Promise<void> {
  set_state_fun({ ...state, loading_balances: true });
  try {
    const ids = [token_in, token_out];
    const info_map = await HUGGIES_TOKEN_INFO.get(ids);
    const account_id = HUGGIES_AUTH.get_account_id();
    // --- WHY --- no account means no balances: the reader is not
    // signed in, so there is nothing to show and nothing to check.
    const balances =
      account_id === null
        ? new Map<string, string>()
        : await HUGGIES_APP_PAGE_SWAP_BALANCES.load(account_id, ids);
    set_state_fun({
      ...state,
      token_in_info: info_map.get(token_in) ?? null,
      token_out_info: info_map.get(token_out) ?? null,
      balances,
      loading_balances: false,
    });
  } catch (err) {
    set_state_fun({
      ...state,
      loading_balances: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
// ========================================
// ========================================
// --- ROUTES ----------------------------
// the routes for the current pair and amount.
//
// --- WHY --- the quote is asked for TWICE: once with a plain fetch, so
// the screen has something on it immediately, and once over the socket,
// so the amount out stays live as the pools move. the socket takes a
// moment to open and to answer, so the fetch fills the gap.
async function load_routes_fun(
  token_in: string,
  token_out: string,
  amount_in: string,
): Promise<void> {
  // a quote for a pair the page is no longer showing is not worth
  // asking for.
  if (token_in === token_out) {
    set_state_fun({ ...state, routes: [], loading_routes: false, error: null });
    return;
  }
  quoted_token_in = token_in;
  quoted_token_out = token_out;
  quoted_amount_in = amount_in;
  set_state_fun({ ...state, loading_routes: true, error: null });
  const trader_account_id = HUGGIES_AUTH.get_account_id();
  try {
    const routes = await HUGGIES_APP_PAGE_SWAP_ROUTES.get(
      token_in,
      token_out,
      amount_in,
      trader_account_id,
    );
    // a quote for an older pair or amount must not overwrite the newer
    // one.
    if (
      quoted_token_in !== token_in ||
      quoted_token_out !== token_out ||
      quoted_amount_in !== amount_in
    ) {
      return;
    }
    set_state_fun({
      ...state,
      routes,
      // a new quote drops the reader's route pick: the route they chose
      // may not be in the new list.
      selected_dex_id: null,
      loading_routes: false,
    });
  } catch (err) {
    if (
      quoted_token_in !== token_in ||
      quoted_token_out !== token_out ||
      quoted_amount_in !== amount_in
    ) {
      return;
    }
    set_state_fun({
      ...state,
      routes: [],
      selected_dex_id: null,
      loading_routes: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
// ========================================
// the live subscription for the current pair and amount.
//
// --- WHY --- the subscription is closed and reopened for every quote:
// the socket is bound to ONE query, so an old socket would push stale
// routes over the fresh ones.
function open_subscription_fun(
  token_in: string,
  token_out: string,
  amount_in: string,
): void {
  const trader_account_id = HUGGIES_AUTH.get_account_id();
  void HUGGIES_APP_PAGE_SWAP_ROUTES.subscribe(
    token_in,
    token_out,
    amount_in,
    trader_account_id,
    (routes) => {
      // an update for a pair or amount the page has moved on from is
      // dropped.
      if (
        quoted_token_in !== token_in ||
        quoted_token_out !== token_out ||
        quoted_amount_in !== amount_in
      ) {
        return;
      }
      set_state_fun({ ...state, routes });
    },
    (message) => {
      console.warn("[app_page_swap_store] the route subscription failed", message);
    },
  );
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the page: the pair from the url, their info, their balances and
// the first quote.
async function load_fun(): Promise<void> {
  const tokens = read_tokens_fun();
  HUGGIES_APP_PAGE_SWAP_URL.write(tokens.token_in, tokens.token_out);
  set_state_fun({
    ...state,
    token_in: tokens.token_in,
    token_out: tokens.token_out,
  });
  await load_tokens_and_balances_fun(tokens.token_in, tokens.token_out);
}
// ========================================
// quote the swap: the routes for the current pair and amount, and the
// live subscription that keeps them fresh.
//
// --- WHY --- THE HUMAN AMOUNT COMES IN AND THE UNIT AMOUNT GOES OUT:
// the router quotes in the token's smallest unit, but the reader types
// in whole tokens. the conversion happens HERE, in the store that owns
// the quoting, so every caller quotes the same way and no caller can
// forget the conversion.
async function quote_fun(
  token_in: string,
  token_out: string,
  amount_in: string,
): Promise<void> {
  const info = state.token_in_info;
  if (info === null) return;
  const unit = human_to_unit_fun(amount_in, info.decimals);
  // a half-typed amount has no unit amount, and a zero amount is not
  // a trade. there is nothing to quote.
  if (unit === null || unit === "0") {
    set_state_fun({ ...state, routes: [], loading_routes: false });
    return;
  }
  await load_routes_fun(token_in, token_out, unit);
  // the socket is opened after the fetch answered, so the reader sees
  // the routes immediately and the socket keeps them fresh from there.
  open_subscription_fun(token_in, token_out, unit);
}
// ========================================
// ========================================
// --- SET -------------------------------
// the reader picked a token for one of the two cards.
//
// --- WHY --- the amount is CLEARED: the amount was typed for the old
// token, and carrying it over would ask the router to trade a number
// that means something else entirely.
async function set_token_fun(side: "in" | "out", token_id: string): Promise<void> {
  const trimmed = token_id.trim();
  if (trimmed.length === 0) return;
  if (side === "in") {
    if (state.token_in === trimmed) return;
    set_state_fun({ ...state, token_in: trimmed, amount_in: "" });
    HUGGIES_APP_PAGE_SWAP_URL.write(trimmed, state.token_out);
  } else {
    if (state.token_out === trimmed) return;
    set_state_fun({ ...state, token_out: trimmed, amount_in: "" });
    HUGGIES_APP_PAGE_SWAP_URL.write(state.token_in, trimmed);
  }
  await load_tokens_and_balances_fun(state.token_in, state.token_out);
}
// ========================================
// the reader typed an amount.
function set_amount_fun(amount_in: string): void {
  set_state_fun({ ...state, amount_in });
}
// ========================================
// the reader picked a route.
function select_route_fun(dex_id: string): void {
  set_state_fun({ ...state, selected_dex_id: dex_id });
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_fun(): HUGGIES_APP_PAGE_SWAP_STATE {
  return state;
}
// ========================================
// the route the reader picked, or the best one when they have not
// chosen.
//
// --- WHY --- the best route is the default: it is the one the router
// put first, and the reader has to actively pick another to leave it.
function selected_route_fun(): HUGGIES_SWAP_ROUTE | null {
  if (state.selected_dex_id !== null) {
    const picked = state.routes.find(
      (route) => route.dex_id === state.selected_dex_id,
    );
    if (picked !== undefined) return picked;
  }
  return state.routes[0] ?? null;
}
// ========================================
// the raw balance of one token, or "0".
function balance_of_fun(token_id: string): string {
  return state.balances.get(token_id) ?? "0";
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_SWAP_STORE = {
  load: load_fun,
  quote: quote_fun,
  set_token: set_token_fun,
  set_amount: set_amount_fun,
  select_route: select_route_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  get_selected_route: selected_route_fun,
  get_balance: balance_of_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
