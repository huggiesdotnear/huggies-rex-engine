// ========================================
// the feed page's shared state: the filter, the loaded batches and the
// error.
//
// the page is split into several components — the filter bar, the
// posts, the status line — and they all read this one store, so they
// cannot drift apart. the store owns the load, the components display.
//
// --- WHY THE FILTER AND THE DATA ARE IN ONE STORE: they are ONE view.
// the posts on screen are the ones the filter asked for, and a filter
// that changed without the data changing would leave the reader
// looking at a feed that does not match the bar above it.
import { SHIT_1170_APP_PAGE_FEED_LOAD } from "./app_page_feed_load";
import { SHIT_1170_APP_PAGE_FEED_FILTER } from "./app_page_feed_filter";
import { SHIT_1170_APP_PAGE_FEED_SWAPS } from "./app_page_feed_swaps";
import { SHIT_1170_APP_PAGE_FEED_URL } from "./app_page_feed_url";
import { shit_1170_feed_posts_fun } from "./app_page_feed_posts";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import type {
  SHIT_1170_APP_PAGE_FEED_STATE,
  SHIT_1170_FEED_SORT,
  SHIT_1170_FEED_VIEW,
} from "./app_page_feed_types";
import type { SHIT_1170_TRANSFER_TOKEN } from "../shared/transfer_tokens";
import { SHIT_1170_SWAP_ROUTES } from "../shared/swap_routes";
import type { SHIT_1170_SWAP_ROUTE } from "../shared/swap_routes";
import type {
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_TX_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import type { SHIT_1170_FEED_POST } from "./app_page_feed_posts";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the state the store holds, plus the tokens the batches name.
export interface SHIT_1170_APP_PAGE_FEED_STORE_STATE extends SHIT_1170_APP_PAGE_FEED_STATE {
  // the token metadata for the transfers the batches make.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  // the token metadata for the two tokens each swap names.
  swap_tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  // the live routes of each swap, in the SAME order as `swaps`.
  //
  // --- WHY --- THE ROUTES ARE HELD AND NOT JUST THE QUOTE: the card's
  // SWAP NOW button signs the route the card is showing. so the route
  // has to be here, and the quote is read off it.
  swap_routes: ReadonlyArray<ReadonlyArray<SHIT_1170_SWAP_ROUTE>>;
}
// ========================================
// ========================================
// --- STATE ------------------------------
// the state the page holds.
let state: SHIT_1170_APP_PAGE_FEED_STORE_STATE = {
  view: "all",
  account_id: null,
  hide_sent: false,
  sort: "newest",
  queues: [],
  swaps: [],
  swap_quotes: [],
  swap_routes: [],
  tokens: new Map(),
  swap_tokens: new Map(),
  loading: false,
  error: null,
};
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// the account the page was loaded for, so a load for an older filter
// does not overwrite a newer one.
let loaded_for: string | null = null;
// true while a load is running.
let loading = false;
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
      console.error("[app_page_feed_store] listener failed", err);
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
function set_state_fun(next: SHIT_1170_APP_PAGE_FEED_STORE_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- POSTS ------------------------------
// the batches and the swaps in ONE ordered list.
//
// --- WHY THE POSTS ARE HELD IN THE STORE AND NOT BUILT BY THE
// COMPONENT: the component draws the cards, and the ORDER of the cards
// is the feed's business. one list, built once, read by every card.
function build_posts_fun(): SHIT_1170_FEED_POST[] {
  return shit_1170_feed_posts_fun(
    state.queues,
    state.swaps,
    state.swap_quotes,
    state.swap_routes,
    state.sort,
  );
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the feed: the filter from the url, then the batches.
//
// --- WHY THE FILTER IS READ FROM THE URL HERE AND NOT BY THE
// COMPONENTS: the filter and the data are one view, and the components
// read the store. if each component read the url itself they could
// disagree about which view was on screen.
async function load_fun(): Promise<void> {
  const filter = SHIT_1170_APP_PAGE_FEED_FILTER.read();
  const account_id = filter.view === "mine" ? filter.account_id : null;
  // the url is written so a link the reader copies says the same thing
  // the screen does. the VIEW goes on the url too, so a link to the ALL
  // view opens the ALL view and not the reader's own queues — and the
  // ACCOUNT stays on it, so the reader can flip back to MINE.
  write_url_fun(filter.view, filter.account_id, filter.hide_sent, filter.sort);
  const key = `${account_id ?? ""}|${filter.hide_sent ? "1" : "0"}`;
  if (loading && loaded_for === key) return;
  loaded_for = key;
  loading = true;
  // --- WHY --- THE OLD SUBSCRIPTIONS ARE CLOSED BEFORE THE NEW LOAD:
  // the feed holds a live subscription per card, and a reload changes
  // which cards are on screen. the cards that left must let go of their
  // sockets — otherwise a filtered feed keeps paying for routes nobody
  // is looking at.
  SHIT_1170_SWAP_ROUTES.close_all_subscriptions();
  set_state_fun({
    ...state,
    view: filter.view,
    account_id: filter.account_id,
    hide_sent: filter.hide_sent,
    sort: filter.sort,
    loading: true,
    error: null,
  });
  try {
    const loaded = await SHIT_1170_APP_PAGE_FEED_LOAD.load(
      account_id,
      filter.hide_sent,
    );
    // --- WHY --- THE SWAPS ARE LOADED SEPARATELY AND NOT INSIDE THE
    // QUEUE LOAD: a queued swap is a different resource with a
    // different shape, and the queue loader fetches queues. the two
    // loads run together so the reader sees one batch of work.
    //
    // --- WHY --- A FAILED SWAP LOAD DOES NOT FAIL THE FEED: the queues
    // are the feed's heart, and the swaps are an addition to it. a
    // router that is down must not take the queued batches off the
    // screen with it.
    const swaps_loaded = await load_swaps_fun(account_id);
    // a load for an older filter must not overwrite a newer one.
    if (loaded_for !== key) return;
    loading = false;
    set_state_fun({
      ...state,
      view: filter.view,
      account_id: filter.account_id,
      hide_sent: filter.hide_sent,
      sort: filter.sort,
      queues: loaded.queues,
      tokens: loaded.tokens,
      swaps: swaps_loaded.swaps,
      swap_quotes: swaps_loaded.quotes,
      swap_routes: swaps_loaded.routes,
      swap_tokens: swaps_loaded.tokens,
      loading: false,
      error: null,
    });
  } catch (err) {
    if (loaded_for !== key) return;
    loading = false;
    set_state_fun({
      ...state,
      queues: [],
      swaps: [],
      swap_quotes: [],
      swap_routes: [],
      tokens: new Map(),
      swap_tokens: new Map(),
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
} // ========================================
// ========================================
// --- SWAPS ------------------------------
// the queued swaps, and their live routes.
//
// --- WHY --- THE FAILURE IS SWALLOWED AND NOT PROPAGATED: the swaps are
// an addition to the feed, and a swap queue that is down must not take
// the queued batches off the screen with it. the reader gets the batches
// and no swaps, and the swaps come back on the next load.
async function load_swaps_fun(account_id: string | null): Promise<{
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>;
  quotes: SHIT_1170_APP_PAGE_FEED_STORE_STATE["swap_quotes"];
  routes: SHIT_1170_APP_PAGE_FEED_STORE_STATE["swap_routes"];
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
}> {
  try {
    const loaded = await SHIT_1170_APP_PAGE_FEED_SWAPS.load(
      account_id,
      set_swap_routes_fun,
    );
    return {
      swaps: loaded.swaps,
      quotes: loaded.quotes,
      routes: loaded.routes,
      tokens: loaded.tokens,
    };
  } catch (err) {
    console.warn("[app_page_feed_store] the swaps could not be loaded", err);
    return { swaps: [], quotes: [], routes: [], tokens: new Map() };
  }
}
// ========================================
// --- LIVE ROUTES ------------------------
// one swap's routes changed under the live subscription.
//
// --- WHY --- THE QUOTE IS REBUILT FROM THE ROUTE: the quote IS the
// route's numbers, so when the route changes the numbers change too.
// reading them off the route means the amount on the card and the route
// the button signs can never disagree.
//
// --- WHY --- THE INDEX IS CHECKED: a subscription for a swap that has
// left the screen must not write into the next swap's slot.
function set_swap_routes_fun(
  index: number,
  routes: ReadonlyArray<SHIT_1170_SWAP_ROUTE>,
): void {
  if (index < 0 || index >= state.swaps.length) return;
  const swap_routes = [...state.swap_routes];
  swap_routes[index] = routes;
  const best = routes[0];
  const swap_quotes = [...state.swap_quotes];
  if (best === undefined) {
    swap_quotes[index] = null;
  } else {
    // --- WHY --- THE NUMBERS ARE READ OFF THE MAPPED ROUTE: the mapped
    // route carries the same amounts the raw one does, and reading them
    // from it means the card and the button read the same route.
    const existing = swap_quotes[index];
    swap_quotes[index] = {
      token_in: existing?.token_in ?? state.swaps[index]?.tokenIn ?? "",
      token_out: existing?.token_out ?? state.swaps[index]?.tokenOut ?? "",
      amount_in: existing?.amount_in ?? state.swaps[index]?.amountIn ?? "",
      amount_out: best.amount_out.length > 0 ? best.amount_out : null,
      dex_id: best.dex_id,
      worst_case_out:
        best.worst_case_out.length > 0 ? best.worst_case_out : null,
      route: best.raw,
    };
  }
  set_state_fun({ ...state, swap_routes, swap_quotes });
}
// ========================================
// --- SET -------------------------------
// put the filter on the url.
//
// --- WHY THE URL IS WRITTEN BEFORE THE STATE: the url says what the
// page is showing, and the state and the url must never disagree about
// it.
//
// --- WHY THE DEFAULTS ARE LEFT OFF THE URL: see the url module. the
// sort's default is NEWEST and it is not written.
//
// --- WHY THE ACCOUNT IS WRITTEN IN THE MINE VIEW AND NOT OMITTED: the
// account IS the record of the reader choosing MINE over ALL. a shared
// link with no account would open the ALL view for whoever opened it,
// and the reader's own view is the one they meant to share.
function write_url_fun(
  view: SHIT_1170_FEED_VIEW,
  account_id: string | null,
  hide_sent: boolean,
  sort: SHIT_1170_FEED_SORT,
): void {
  const sort_value =
    sort === "newest"
      ? null
      : SHIT_1170_APP_PAGE_FEED_FILTER.sort_is_known(sort)
        ? sort
        : null;
  SHIT_1170_APP_PAGE_FEED_URL.write_filter(
    view,
    account_id,
    hide_sent,
    sort_value,
  );
}

// ========================================
// --- VIEW ------------------------------
// the reader switched between ALL and MINE.
//
// --- WHY THE MINE VIEW NEEDS AN ACCOUNT: it is the reader's own
// queues. without a signed-in account there is no reader to be "mine",
// so the view does not move.
//
// --- WHY THE URL IS WRITTEN HERE AND NOT ONLY IN THE LOAD: the load
// reads the filter off the url, so the url has to carry the NEW view
// before the load reads it. writing it in the load alone would read
// the OLD url and load the OLD view.
async function set_view_fun(view: SHIT_1170_FEED_VIEW): Promise<void> {
  if (view === state.view) return;
  if (view === "mine") {
    const account_id = SHIT_1170_AUTH.get_account_id();
    if (account_id === null) return;
    set_state_fun({ ...state, view, account_id });
    write_url_fun(view, account_id, state.hide_sent, state.sort);
  } else {
    // --- WHY --- THE ACCOUNT IS KEPT AND NOT CLEARED: the account is the
    // reader's own, and it is what the MINE view filters by. clearing it
    // would lose the reader's account when they flip back.
    //
    // --- WHY --- IT GOES ON THE URL IN THE ALL VIEW TOO: the url's
    // account says whose queues the MINE view would show, and the view
    // param says which question is being asked. the api is asked with
    // NO account in the ALL view — that is the request — but the url
    // keeps the account so the reader can flip back.
    set_state_fun({ ...state, view, hide_sent: false });
    write_url_fun(view, state.account_id, false, state.sort);
  }
  await load_fun();
}
// ========================================
// --- HIDE SENT -------------------------
// the reader flipped the hide-sent switch.
//
// --- WHY IT IS OFF AGAIN IN THE ALL VIEW: "has this account sent it"
// is a question about one account, and the ALL view has none.
//
// --- WHY THE URL IS WRITTEN HERE AND NOT ONLY IN THE LOAD: the load
// reads the filter off the url, so the url has to carry the NEW switch
// before the load reads it.
async function set_hide_sent_fun(hide_sent: boolean): Promise<void> {
  if (hide_sent && state.view !== "mine") return;
  if (hide_sent === state.hide_sent) return;
  set_state_fun({ ...state, hide_sent });
  write_url_fun(
    state.view,
    SHIT_1170_APP_PAGE_FEED_FILTER.account_of(state),
    hide_sent,
    state.sort,
  );
  await load_fun();
}
// ========================================
// --- SORT ------------------------------
// the reader picked another sort.
//
// --- WHY THE SORT DOES NOT RE-READ THE FEED: the api has no sort
// parameter, so the list is the same one and only its order changes.
// asking the api again would cost a request for nothing.
function set_sort_fun(sort: SHIT_1170_FEED_SORT): void {
  if (sort === state.sort) return;
  set_state_fun({
    ...state,
    sort,
  });
  write_url_fun(
    state.view,
    SHIT_1170_APP_PAGE_FEED_FILTER.account_of(state),
    state.hide_sent,
    sort,
  );
}
// ========================================
// ========================================
// --- REFRESH ---------------------------
// read the feed again, with the filter the page holds.
//
// --- WHY IT EXISTS: the reader sent something, or another account sent
// something, and the feed should say so without a reload.
async function refresh_fun(): Promise<void> {
  await load_fun();
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_fun(): SHIT_1170_APP_PAGE_FEED_STORE_STATE {
  return state;
}
// ========================================
// the token metadata for one token id, or null when it is unknown.
function token_of_fun(token_id: string): SHIT_1170_TRANSFER_TOKEN | null {
  return state.tokens.get(token_id) ?? null;
}
// ========================================
// the token metadata for one swap token id, or null when it is unknown.
function swap_token_of_fun(token_id: string): SHIT_1170_TRANSFER_TOKEN | null {
  return state.swap_tokens.get(token_id) ?? null;
}
// ========================================
// --- WATCH -----------------------------
// follow the auth state, so a sign-in or a sign-out moves the feed.
//
// --- WHY THE FEED WATCHES THE AUTH: the default view depends on
// whether anybody is signed in. a reader who signs in while the feed
// is open wants their own queue, and a reader who signs out wants all
// of it.
function watch_fun(): () => void {
  return SHIT_1170_AUTH.subscribe(() => {
    void load_fun();
  });
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_STORE = {
  load: load_fun,
  refresh: refresh_fun,
  set_view: set_view_fun,
  set_hide_sent: set_hide_sent_fun,
  set_sort: set_sort_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  get_token: token_of_fun,
  get_swap_token: swap_token_of_fun,
  get_posts: build_posts_fun,
  watch: watch_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
