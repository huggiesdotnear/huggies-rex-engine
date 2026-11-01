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
import { human_to_unit_fun, unit_to_human_fun } from "./app_page_swap_amount";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "../shared/token_info";
import type { HUGGIES_SWAP_ROUTE } from "./app_page_swap_routes";
import type { HUGGIES_SWAP_AMOUNT_SIDE } from "./app_page_swap_amount_side";
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
  // the human amount the reader typed for the token out. it is only
  // there when the reader fixes the OUT side.
  amount_out: string;
  // which side the reader is fixing: the one they type into.
  //
  // --- WHY --- the page quotes on ONE side at a time, because the
  // router answers one question at a time. the reader says which
  // question they are asking by typing into that side's box.
  amount_side: HUGGIES_SWAP_AMOUNT_SIDE;
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
// --- WHY NEAR FOR $SHIT: $SHIT is this app's own token, and NEAR is
// the one every wallet holds, so the pair a reader can actually trade
// is the one the page opens on. the reader picks their own pair with
// the token picker.
const HUGGIES_SWAP_DEFAULT_TOKEN_IN = HUGGIES_NEAR_ID;
const HUGGIES_SWAP_DEFAULT_TOKEN_OUT = "shit-1170.meme-cooking.near";
// ========================================
// ========================================
// --- STATE ------------------------------
// the state the page holds.
let state: HUGGIES_APP_PAGE_SWAP_STATE = {
  token_in: HUGGIES_SWAP_DEFAULT_TOKEN_IN,
  token_out: HUGGIES_SWAP_DEFAULT_TOKEN_OUT,
  amount_in: "",
  amount_out: "",
  amount_side: "in",
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
// the side the live quote was asked for. a quote on the other side is
// about a different question, so it must not overwrite this one.
let quoted_amount_side: HUGGIES_SWAP_AMOUNT_SIDE = "in";
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
  amount: string,
  side: HUGGIES_SWAP_AMOUNT_SIDE,
): Promise<void> {
  // a quote for a pair the page is no longer showing is not worth
  // asking for.
  if (token_in === token_out) {
    clear_routes_fun();
    return;
  }
  quoted_token_in = token_in;
  quoted_token_out = token_out;
  quoted_amount_in = amount;
  quoted_amount_side = side;
  set_state_fun({ ...state, loading_routes: true, error: null });
  const trader_account_id = HUGGIES_AUTH.get_account_id();
  try {
    const routes = await HUGGIES_APP_PAGE_SWAP_ROUTES.get(
      token_in,
      token_out,
      amount,
      side,
      trader_account_id,
    );
    // a quote for an older pair or amount must not overwrite the newer
    // one.
    if (!is_current_quote_fun(token_in, token_out, amount, side)) {
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
    if (!is_current_quote_fun(token_in, token_out, amount, side)) {
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
// is the quote for these four things the one the page is showing?
//
// --- WHY --- it is ONE helper and not the same four checks written
// twice: a quote is identified by its pair, its amount AND its side, and
// a check that forgets one of them lets a stale answer through.
function is_current_quote_fun(
  token_in: string,
  token_out: string,
  amount: string,
  side: HUGGIES_SWAP_AMOUNT_SIDE,
): boolean {
  return (
    quoted_token_in === token_in &&
    quoted_token_out === token_out &&
    quoted_amount_in === amount &&
    quoted_amount_side === side
  );
}
// ========================================
// drop the routes on screen and close the socket that feeds them.
//
// --- WHY --- THE SOCKET IS CLOSED HERE: the socket is bound to ONE
// query, and it keeps pushing that query's answer for as long as it is
// open. so clearing the routes without closing the socket lets the old
// socket put the very routes we just cleared straight back — which is
// how the output box kept showing an amount after the reader erased
// the input amount.
//
// --- WHY --- THE QUOTE IS MARKED AS GONE: the guard the socket's
// callback checks has to say "nothing is current", or the callback
// would still see a match and push its routes.
function clear_routes_fun(): void {
  quoted_token_in = null;
  quoted_token_out = null;
  quoted_amount_in = null;
  HUGGIES_APP_PAGE_SWAP_ROUTES.close_subscription();
  set_state_fun({
    ...state,
    routes: [],
    selected_dex_id: null,
    loading_routes: false,
  });
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
  amount: string,
  side: HUGGIES_SWAP_AMOUNT_SIDE,
): void {
  const trader_account_id = HUGGIES_AUTH.get_account_id();
  void HUGGIES_APP_PAGE_SWAP_ROUTES.subscribe(
    token_in,
    token_out,
    amount,
    side,
    trader_account_id,
    (routes) => {
      // an update for a pair or amount the page has moved on from is
      // dropped.
      if (!is_current_quote_fun(token_in, token_out, amount, side)) {
        return;
      }
      set_state_fun({ ...state, routes });
    },
    (message) => {
      console.warn(
        "[app_page_swap_store] the route subscription failed",
        message,
      );
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
//
// --- WHY THE SIDE IS READ FROM THE STATE AND NOT PASSED IN: the side
// is the reader's intent — which box they typed into — and the state
// already holds it. a caller that passed it could pass the wrong one.
//
// --- WHY THE AMOUNT IS CLEARED WHEN IT IS EMPTY: a half-typed amount
// has no unit amount, and a zero amount is not a trade. there is
// nothing to quote, so the routes go AND the socket that feeds them
// is closed — otherwise the old socket pushes its answer straight back
// and the output box keeps showing an amount the reader has erased.
async function quote_fun(): Promise<void> {
  const side = state.amount_side;
  const human = side === "in" ? state.amount_in : state.amount_out;
  const info = side === "in" ? state.token_in_info : state.token_out_info;
  // --- WHY --- THE ROUTES GO WHEN THE TOKEN IS NOT KNOWN YET: without
  // the token's decimals there is no unit amount, so there is nothing
  // to quote — and the routes on screen answer the OLD pair, so they
  // would sit there claiming a number for a pair that has moved on.
  if (info === null) {
    clear_routes_fun();
    return;
  }
  const unit = human_to_unit_fun(human, info.decimals);
  if (unit === null || unit === "0") {
    clear_routes_fun();
    return;
  }
  await load_routes_fun(state.token_in, state.token_out, unit, side);
  // the socket is opened after the fetch answered, so the reader sees
  // the routes immediately and the socket keeps them fresh from there.
  open_subscription_fun(state.token_in, state.token_out, unit, side);
}
// ========================================
// ========================================
// --- SET -------------------------------
// the reader picked a token for one of the two cards.
//
// --- WHY --- the amount is CLEARED: the amount was typed for the old
// token, and carrying it over would ask the router to trade a number
// that means something else entirely.
//
// --- WHY --- PICKING THE TOKEN ON THE OTHER SIDE SWAPS THE PAIR: the
// reader who picks the token that is already on the other side is
// saying "I want to trade the other way round". refusing the pick
// would leave the reader stuck with a pair they cannot trade, and
// putting the same token on both sides would leave the page with no
// route at all — a swap of a token for itself. so the two sides trade
// places, which is what the reader meant, and the page always holds a
// pair that can trade.
async function set_token_fun(
  side: "in" | "out",
  token_id: string,
): Promise<void> {
  const trimmed = token_id.trim();
  if (trimmed.length === 0) return;
  if (side === "in") {
    // the token is already on this side: nothing to do.
    if (state.token_in === trimmed) return;
    // the token is on the OTHER side: the two sides trade places.
    if (state.token_out === trimmed) {
      await swap_pair_fun();
      return;
    }
    set_state_fun({
      ...state,
      token_in: trimmed,
      amount_in: "",
      amount_out: "",
    });
    HUGGIES_APP_PAGE_SWAP_URL.write(trimmed, state.token_out);
  } else {
    // the token is already on this side: nothing to do.
    if (state.token_out === trimmed) return;
    // the token is on the OTHER side: the two sides trade places.
    if (state.token_in === trimmed) {
      await swap_pair_fun();
      return;
    }
    set_state_fun({
      ...state,
      token_out: trimmed,
      amount_in: "",
      amount_out: "",
    });
    HUGGIES_APP_PAGE_SWAP_URL.write(state.token_in, trimmed);
  }
  clear_routes_fun();
  await load_tokens_and_balances_fun(state.token_in, state.token_out);
}
// ========================================
// the two sides trade places: the token on one side becomes the token
// on the other.
//
// --- WHY IT IS ITS OWN ACTION: it is what happens when the reader
// picks the token that is already on the other side, and it is the
// one place where BOTH tokens change at once. two separate writes
// would read the state the first write already changed, and the pair
// would end up with the same token on both sides.
async function swap_pair_fun(): Promise<void> {
  const old_token_in = state.token_in;
  const old_token_out = state.token_out;
  set_state_fun({
    ...state,
    token_in: old_token_out,
    token_out: old_token_in,
    amount_in: "",
    amount_out: "",
  });
  HUGGIES_APP_PAGE_SWAP_URL.write(old_token_out, old_token_in);
  clear_routes_fun();
  await load_tokens_and_balances_fun(old_token_out, old_token_in);
}
// ========================================
// the reader typed an amount, in one of the two boxes.
//
// --- WHY THE SIDE IS SET HERE AND NOT BY THE CALLER: typing into a
// box IS the reader saying which side they are fixing. the box that
// was typed into is the side the router is asked about, and the other
// box then shows what the router answers.
//
// --- WHY THE OTHER SIDE'S AMOUNT IS CLEARED: the two boxes are two
// views of ONE quote. the reader typed the new amount, so the old
// answer on the other side is stale and must go.
function set_amount_fun(side: HUGGIES_SWAP_AMOUNT_SIDE, amount: string): void {
  if (side === "in") {
    set_state_fun({
      ...state,
      amount_in: amount,
      amount_out: "",
      amount_side: "in",
    });
  } else {
    set_state_fun({
      ...state,
      amount_out: amount,
      amount_in: "",
      amount_side: "out",
    });
  }
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
// the reader hit the switch direction bar: the two sides trade places.
//
// --- WHY --- THIS IS ONE ACTION AND NOT TWO set_token CALLS: setting
// the two tokens one after the other reads the state that the FIRST
// call already changed, so the second call puts the same token on both
// sides. that is the bug the reader hit — both cards showing the same
// token — and it only shows up sometimes, because it depends on the
// order the two updates land in. one action, one state write, both
// sides moved together.
//
// --- WHY --- THE AMOUNT CARRIES OVER: the reader fixed one side of
// the swap, and the other side is what the router answered. after the
// switch the two tokens trade places, so the two amounts trade places
// with them: the amount they FIXED becomes the amount they SELL, and
// the amount the router ANSWERED becomes the amount they RECEIVE.
//
// --- WHY THE SIDE FLIPS WITH IT: the box the reader typed into was
// the side they were fixing. after the switch that amount is on the
// other side of the pair, so the side they are fixing flips too.
//
// --- WHY THE ROUTES GO: the routes on screen answer the old pair, and
// the new pair has to be quoted again.
async function switch_direction_fun(): Promise<void> {
  const old_token_in = state.token_in;
  const old_token_out = state.token_out;
  // the amount the reader fixed, and the side it was on.
  const fixed_amount =
    state.amount_side === "in" ? state.amount_in : state.amount_out;
  const fixed_side = state.amount_side;
  // --- WHY THE ROUTE IS READ BEFORE THE STATE MOVES: the route on
  // screen answers the OLD pair, and the amount the reader will RECEIVE
  // after the switch is the other side of that quote. when they fixed
  // the input, that is the quoted output; when they fixed the output,
  // that is the quoted input.
  const route = selected_route_fun();
  // the answered amount, in the token it is in. it is in the OLD token
  // that the reader was NOT fixing.
  const answered_unit =
    route === null
      ? null
      : fixed_side === "in"
        ? route.amount_out
        : route.amount_in;
  const answered_decimals =
    fixed_side === "in"
      ? (state.token_out_info?.decimals ?? 0)
      : (state.token_in_info?.decimals ?? 0);
  const answered_amount =
    answered_unit === null
      ? ""
      : unit_to_human_fun(answered_unit, answered_decimals);
  // the new pair: the old output token is sold, the old input token is
  // bought.
  const new_token_in = old_token_out;
  const new_token_out = old_token_in;
  // --- WHY THE AMOUNTS TRADE PLACES WITH THE TOKENS: the reader said
  // "sell 5 A and get 10 B". after the switch the pair is (B, A), and
  // the SAME trade reads "sell 10 B and get 5 A". so the amount that was
  // on one side moves to the other, and the answer moves with it.
  const new_amount_in = fixed_side === "in" ? answered_amount : fixed_amount;
  const new_amount_out = fixed_side === "in" ? fixed_amount : answered_amount;
  // the side they are fixing flips: the box they typed into was the
  // side they were fixing, and it is now the OTHER side.
  const new_side: HUGGIES_SWAP_AMOUNT_SIDE = fixed_side === "in" ? "out" : "in";
  set_state_fun({
    ...state,
    token_in: new_token_in,
    token_out: new_token_out,
    amount_in: new_amount_in,
    amount_out: new_amount_out,
    amount_side: new_side,
  });
  HUGGIES_APP_PAGE_SWAP_URL.write(new_token_in, new_token_out);
  clear_routes_fun();
  await load_tokens_and_balances_fun(new_token_in, new_token_out);
  // the amount the reader fixed is now the amount they SELL, and it has
  // to be quoted for the NEW pair.
  const info = new_side === "in" ? state.token_in_info : state.token_out_info;
  if (info === null) return;
  const unit = human_to_unit_fun(
    new_side === "in" ? new_amount_in : new_amount_out,
    info.decimals,
  );
  if (unit === null || unit === "0") return;
  await load_routes_fun(new_token_in, new_token_out, unit, new_side);
  open_subscription_fun(new_token_in, new_token_out, unit, new_side);
}
// ========================================
// put the page back the way it opens.
//
// --- WHY --- THE WHOLE PAGE IS RESET AND NOT JUST THE PAIR: the store
// holds more than the pair. it holds the amount, the route pick, the
// balances and the live subscription, and a reset that left any of
// those behind would leave the page answering a question the reader
// is no longer asking.
//
// --- WHY --- THE SUBSCRIPTION IS CLOSED: a reset that left the socket
// open would let it push the old pair's routes over the new pair's.
function reset_fun(): void {
  clear_routes_fun();
  quoted_amount_side = "in";
  set_state_fun({
    token_in: HUGGIES_SWAP_DEFAULT_TOKEN_IN,
    token_out: HUGGIES_SWAP_DEFAULT_TOKEN_OUT,
    amount_in: "",
    amount_out: "",
    amount_side: "in",
    token_in_info: null,
    token_out_info: null,
    balances: new Map(),
    routes: [],
    selected_dex_id: null,
    loading_routes: false,
    loading_balances: false,
    swapping: false,
    error: null,
  });
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_SWAP_STORE = {
  load: load_fun,
  quote: quote_fun,
  set_token: set_token_fun,
  set_amount: set_amount_fun,
  switch_direction: switch_direction_fun,
  select_route: select_route_fun,
  reset: reset_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  get_selected_route: selected_route_fun,
  get_balance: balance_of_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
