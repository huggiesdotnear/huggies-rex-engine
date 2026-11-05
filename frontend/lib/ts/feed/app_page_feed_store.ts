// ========================================
// the feed page's shared state: the filter, the loaded batches and the
// error.
//
// the page is split into several components — the filter bar, the
// posts, the status line — and they all read this one store, so they
// cannot drift apart. the store owns the load, the components display.
//
// --- WHY THE FILTER AND THE DATA ARE IN ONE STORE: they are ONE thing.
// the posts on screen are the ones the filter asked for, and a filter
// that changed without the data changing would leave the reader
// looking at a feed that does not match the bar above it.
import { SHIT_1170_APP_PAGE_FEED_LOAD } from "./app_page_feed_load";
import { SHIT_1170_APP_PAGE_FEED_FILTER } from "./app_page_feed_filter";
import { SHIT_1170_APP_PAGE_FEED_FACETS } from "./app_page_feed_facets";
import { SHIT_1170_APP_PAGE_FEED_SAVED } from "./app_page_feed_saved";
import { SHIT_1170_APP_PAGE_FEED_SWAPS } from "./app_page_feed_swaps";
import { SHIT_1170_APP_PAGE_FEED_URL } from "./app_page_feed_url";
import { shit_1170_feed_posts_fun } from "./app_page_feed_posts";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import { SHIT_1170_TOAST_STORE } from "../shared/toast_store";
import type {
  SHIT_1170_APP_PAGE_FEED_STATE,
  SHIT_1170_FEED_DIRECTION,
  SHIT_1170_FEED_SORT,
  SHIT_1170_FEED_TYPE,
} from "./app_page_feed_types";
import type { SHIT_1170_TRANSFER_TOKEN } from "../shared/transfer_tokens";
import { SHIT_1170_SWAP_ROUTES } from "../shared/swap_routes";
import type { SHIT_1170_SWAP_ROUTE } from "../shared/swap_routes";
import type {
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_TX_QUEUE,
  SHIT_1170_TX_QUEUE_FACETS,
} from "@huggies/shit-1170-rex-engine-middleman";
import type { SHIT_1170_FEED_POST } from "./app_page_feed_posts";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the state the store holds, plus the tokens the batches name.
export interface SHIT_1170_APP_PAGE_FEED_STORE_STATE extends SHIT_1170_APP_PAGE_FEED_STATE {
  // the token metadata for the transfers the batches name.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  // the token metadata for the two tokens each swap names.
  swap_tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  // the live routes of each swap, in the SAME order as `swaps`.
  //
  // --- WHY --- THE ROUTES ARE HELD AND NOT JUST THE QUOTE: the card's
  // SWAP NOW button signs the route the card is showing. so the route
  // has to be here, and the quote is read off it.
  swap_routes: ReadonlyArray<ReadonlyArray<SHIT_1170_SWAP_ROUTE>>;
  // the reader's balance of each token a swap sells, keyed by token id.
  //
  // --- WHY --- THE BALANCES ARE HELD: the SWAP NOW button is off when
  // the reader does not hold enough of the token the swap sells. a
  // button that cannot work is noise, and a trade the reader cannot
  // afford is a trade they should not be offered.
  swap_balances: Map<string, string>;
}
// ========================================
// ========================================
// --- STATE ------------------------------
// the state the page holds.
let state: SHIT_1170_APP_PAGE_FEED_STORE_STATE = {
  hide_sent: false,
  sort: "date_added",
  direction: "desc",
  type: "all",
  contracts: [],
  accounts: [],
  queues: [],
  swaps: [],
  swap_quotes: [],
  swap_routes: [],
  swap_balances: new Map(),
  tokens: new Map(),
  swap_tokens: new Map(),
  total: 0,
  next_cursor: null,
  swaps_cursor: null,
  loading_more: false,
  facets: null,
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
// the cursors the NEXT pages start at, one for each kind of post.
//
// --- WHY --- THERE ARE TWO AND NOT ONE: the queued batches and the
// queued swaps are TWO lists with TWO tables and TWO cursor shapes. the
// api hands each list its own opaque token and only the api can read it
// back, so one list's cursor cannot be sent to the other.
//
// --- WHY --- THE CURSORS ARE HELD BESIDE THE STATE AND NOT INSIDE IT:
// the state is what the components read, and the cursors are what the
// STORE asks the api with. the two are the same page though, so the
// state carries them too and the components can see whether there is
// another page.
let queues_cursor: string | null = null;
let swaps_cursor: string | null = null;
// true while the next page is on its way.
let loading_more = false;
// the facets, once they have been read. they are asked for ONCE when
// the page opens.
//
// --- WHY --- THEY ARE CACHED HERE AND NOT IN THE STATE: the state is
// what the components read, and the facets are also what the STORE
// asks the api with. one copy, held here, and the state carries it.
let facets: SHIT_1170_TX_QUEUE_FACETS | null = null;
// true while the facets are on their way.
let facets_loading = false;
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
    state.direction,
  );
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the feed: the filter from the url, then the batches.
//
// --- WHY THE FILTER IS READ FROM THE URL HERE AND NOT BY THE
// COMPONENTS: the filter and the data are one thing, and the components
// read the store. if each component read the url itself they could
// disagree about what was on screen.
async function load_fun(): Promise<void> {
  const filter = SHIT_1170_APP_PAGE_FEED_FILTER.read();
  // --- WHY --- THE SAVED FILTER IS USED ONLY FOR THE FIRST READ: the
  // reader's own picks go on the url as soon as they make them, and
  // from then on the url is the truth. the saved filter fills in the
  // blanks while the page is opening and never again.
  SHIT_1170_APP_PAGE_FEED_FILTER.saved_done();
  // --- WHY --- THE ACCOUNT THE API IS ASKED FOR: the picked accounts are
  // the reader's own narrower choice and they go out as the comma
  // separated list the api reads. the reader's OWN account is not added
  // to it — the reader asked for the accounts they picked.
  const account_id =
    filter.accounts.length > 0 ? filter.accounts.join(",") : null;
  // the url is written so a link the reader copies says the same thing
  // the screen does. the picked ACCOUNTS go on it, so a link to the
  // reader's own queues opens the reader's own queues.
  write_url_fun(
    filter.hide_sent,
    filter.sort,
    filter.type,
    filter.contracts,
    filter.accounts,
    filter.direction,
  );
  const key = filter_key_fun(
    account_id,
    filter.hide_sent,
    filter.type,
    filter.contracts,
    filter.accounts,
    filter.sort,
    filter.direction,
  );
  if (loading && loaded_for === key) return;
  loaded_for = key;
  loading = true;
  // --- WHY --- THE PAGINATION RESETS HERE: the cursor is where the
  // NEXT page starts, and a new filter is a new list. the cursors go
  // back to null and the list starts again from the first page.
  queues_cursor = null;
  swaps_cursor = null;
  loading_more = false;
  // --- WHY --- THE OLD SUBSCRIPTIONS ARE CLOSED BEFORE THE NEW LOAD:
  // the feed holds a live subscription per card, and a reload changes
  // which cards are on screen. the cards that left must let go of their
  // sockets — otherwise a filtered feed keeps paying for routes nobody
  // is looking at.
  SHIT_1170_SWAP_ROUTES.close_all_subscriptions();
  set_state_fun({
    ...state,
    hide_sent: filter.hide_sent,
    sort: filter.sort,
    direction: filter.direction,
    type: filter.type,
    contracts: filter.contracts,
    accounts: filter.accounts,
    loading: true,
    error: null,
  });
  try {
    // --- WHY --- THE TWO KINDS OF POST ARE ASKED FOR TOGETHER AND THE
    // FACETS ALONGSIDE THEM: the reader sees one batch of work, and
    // the facets are a summary of the same queue.
    const [loaded, swaps_loaded, facets] = await Promise.all([
      load_queues_fun(account_id, filter),
      load_swaps_fun(account_id, filter),
      load_facets_fun(),
    ]);
    // a load for an older filter must not overwrite a newer one.
    if (loaded_for !== key) return;
    loading = false;
    queues_cursor = loaded.next_cursor;
    swaps_cursor = swaps_loaded.next_cursor;
    set_state_fun({
      ...state,
      hide_sent: filter.hide_sent,
      sort: filter.sort,
      direction: filter.direction,
      type: filter.type,
      contracts: filter.contracts,
      accounts: filter.accounts,
      queues: loaded.queues,
      tokens: loaded.tokens,
      swaps: swaps_loaded.swaps,
      swap_quotes: swaps_loaded.quotes,
      swap_routes: swaps_loaded.routes,
      swap_balances: swaps_loaded.balances,
      swap_tokens: swaps_loaded.tokens,
      total: total_of_fun(loaded.total, swaps_loaded.total, filter.type),
      next_cursor: queues_cursor,
      swaps_cursor: swaps_cursor,
      loading_more: false,
      loading: false,
      facets: facets ?? state.facets,
      error: null,
    });
  } catch (err) {
    if (loaded_for !== key) return;
    loading = false;
    queues_cursor = null;
    swaps_cursor = null;
    set_state_fun({
      ...state,
      queues: [],
      swaps: [],
      swap_quotes: [],
      swap_routes: [],
      swap_balances: new Map(),
      tokens: new Map(),
      swap_tokens: new Map(),
      total: 0,
      next_cursor: null,
      swaps_cursor: null,
      loading_more: false,
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
} // ========================================
// ========================================
// --- QUEUES ----------------------------
// the queued batches, and their tokens.
//
// --- WHY THE QUEUES ARE NOT ASKED FOR IN THE SWAPS' VIEW: the feed's
// TYPE filter says which kind of post the reader wants, and asking for
// the other kind as well is half the requests for nothing.
async function load_queues_fun(
  account_id: string | null,
  filter: {
    hide_sent: boolean;
    type: SHIT_1170_FEED_TYPE;
    contracts: ReadonlyArray<string>;
  },
): Promise<{
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>;
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  total: number;
  next_cursor: string | null;
}> {
  if (filter.type === "swaps") {
    return { queues: [], tokens: new Map(), total: 0, next_cursor: null };
  }
  const contracts =
    filter.contracts.length === 0 ? null : filter.contracts.join(",");
  const loaded = await SHIT_1170_APP_PAGE_FEED_LOAD.load(
    account_id,
    filter.hide_sent,
    contracts,
    null,
  );
  return {
    queues: loaded.queues,
    tokens: loaded.tokens,
    total: loaded.total,
    next_cursor: loaded.next_cursor,
  };
}
// ========================================
// ========================================
// --- SWAPS ------------------------------
// the queued swaps, and their live routes.
//
// --- WHY --- THE FAILURE IS SWALLOWED AND NOT PROPAGATED: the swaps are
// an addition to the feed, and a swap queue that is down must not take
// the queued batches off the screen with it. the reader gets the batches
// and no swaps, and the swaps come back on the next load.
async function load_swaps_fun(
  account_id: string | null,
  filter: {
    hide_sent: boolean;
    type: SHIT_1170_FEED_TYPE;
    contracts: ReadonlyArray<string>;
  },
): Promise<{
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>;
  quotes: SHIT_1170_APP_PAGE_FEED_STORE_STATE["swap_quotes"];
  routes: SHIT_1170_APP_PAGE_FEED_STORE_STATE["swap_routes"];
  balances: SHIT_1170_APP_PAGE_FEED_STORE_STATE["swap_balances"];
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  total: number;
  next_cursor: string | null;
}> {
  if (filter.type === "calls") {
    return {
      swaps: [],
      quotes: [],
      routes: [],
      balances: new Map(),
      tokens: new Map(),
      total: 0,
      next_cursor: null,
    };
  }
  try {
    // --- WHY --- THE SWAPS GET THE SAME CONTRACTS AS THE BATCHES: both
    // kinds of post answer the reader's contracts pick, and the swaps
    // match when either of their two tokens is a picked contract.
    const contracts =
      filter.contracts.length === 0 ? null : filter.contracts.join(",");
    const loaded = await SHIT_1170_APP_PAGE_FEED_SWAPS.load(
      account_id,
      filter.hide_sent,
      contracts,
      null,
      set_swap_routes_fun,
    );
    return {
      swaps: loaded.swaps,
      quotes: loaded.quotes,
      routes: loaded.routes,
      balances: loaded.balances,
      tokens: loaded.tokens,
      total: loaded.total,
      next_cursor: loaded.next_cursor,
    };
  } catch (err) {
    console.warn("[app_page_feed_store] the swaps could not be loaded", err);
    return {
      swaps: [],
      quotes: [],
      routes: [],
      balances: new Map(),
      tokens: new Map(),
      total: 0,
      next_cursor: null,
    };
  }
}
// ========================================
// ========================================
// --- FACETS ----------------------------
// the contracts and the accounts that have queued work.
//
// --- WHY IT IS ASKED FOR ONCE AND NEVER AGAIN: the facets are a
// summary of the WHOLE queue and they do not change when a filter
// changes. one request when the page opens is enough.
//
// --- WHY A FAILED FACETS LOAD IS SWALLOWED: the facets only build the
// filter bar's buttons. a reader with no contract buttons still has the
// whole feed, and a failed facets call must not take the feed with it.
async function load_facets_fun(): Promise<SHIT_1170_TX_QUEUE_FACETS | null> {
  if (facets !== null) return facets;
  if (facets_loading) return null;
  facets_loading = true;
  try {
    facets = await SHIT_1170_APP_PAGE_FEED_FACETS.load();
    return facets;
  } catch (err) {
    console.warn("[app_page_feed_store] the facets could not be read", err);
    return null;
  } finally {
    facets_loading = false;
  }
}
// ========================================
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
// ========================================
// --- PAGINATION -------------------------
// load the NEXT page and APPEND it to what is on screen.
//
// --- WHY THE PAGES ARE APPENDED AND NOT REPLACED: the reader keeps
// what they scrolled to. a page that replaced the list would throw
// away the posts the reader was reading.
//
// --- WHY THE CURSOR IS THE API'S OWN: the queue list pages by cursor,
// and the cursor it hands back is the only thing that knows where the
// next page starts. it is stored and sent back untouched.
//
// --- WHY EACH LIST IS ASKED WITH ITS OWN CURSOR: the batches and the
// swaps are two tables with two cursor shapes, and one list's cursor
// cannot be sent to the other.
//
// --- WHY A PAGE THAT FAILS LEAVES THE LIST ALONE: the reader has
// posts on screen and a failed page costs them the next page and not
// the posts.
async function load_more_fun(): Promise<void> {
  if (loading || loading_more) return;
  // --- WHY --- THERE IS NOTHING TO ASK FOR WHEN NEITHER LIST HAS A
  // CURSOR: the whole match is on screen already.
  if (queues_cursor === null && swaps_cursor === null) return;
  const queues_page_cursor = queues_cursor;
  const swaps_page_cursor = swaps_cursor;
  loading_more = true;
  set_state_fun({ ...state, loading_more: true });
  // --- WHY --- THE FILTER COMES FROM THE STATE AND NOT FROM THE URL:
  // the next page belongs to the filter that is on screen, and the state
  // IS that filter. reading the url here could ask for a page of a
  // filter the reader has already left.
  const filter = {
    hide_sent: state.hide_sent,
    type: state.type,
    contracts: state.contracts,
  };
  // --- WHY --- THE ACCOUNT IS THE PICKED LIST AND NOTHING ELSE: the next
  // page belongs to the same list as the first one, and the list is the
  // accounts the reader picked.
  const account_id =
    state.accounts.length > 0 ? state.accounts.join(",") : null;
  try {
    const [loaded, swaps_loaded] = await Promise.all([
      load_queues_more_fun(account_id, filter, queues_page_cursor),
      load_swaps_more_fun(account_id, filter, swaps_page_cursor),
    ]);
    // --- WHY --- THE CURSOR MOVES ON ONLY WHEN SOMETHING CAME BACK: a
    // failed page must be asked for again, and a cursor that moved past
    // a failed page would skip the posts in it.
    if (loaded.next_cursor !== null) queues_cursor = loaded.next_cursor;
    if (swaps_loaded.next_cursor !== null) {
      swaps_cursor = swaps_loaded.next_cursor;
    }
    set_state_fun({
      ...state,
      queues: [...state.queues, ...loaded.queues],
      tokens: new Map([...state.tokens, ...loaded.tokens]),
      swaps: [...state.swaps, ...swaps_loaded.swaps],
      swap_quotes: [...state.swap_quotes, ...swaps_loaded.quotes],
      swap_routes: [...state.swap_routes, ...swaps_loaded.routes],
      swap_balances: new Map([
        ...state.swap_balances,
        ...swaps_loaded.balances,
      ]),
      swap_tokens: new Map([...state.swap_tokens, ...swaps_loaded.tokens]),
      next_cursor: queues_cursor,
      swaps_cursor: swaps_cursor,
      loading_more: false,
    });
  } catch (err) {
    console.warn("[app_page_feed_store] the next page could not be read", err);
    set_state_fun({
      ...state,
      loading_more: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ========================================
// --- PAGE HELPERS ----------------------
// the next page of batches.
//
// --- WHY --- THE QUEUES ARE NOT ASKED FOR IN THE SWAPS' VIEW: the feed's
// TYPE filter says which kind of post the reader wants, and asking for
// the other kind as well is half the requests for nothing.
async function load_queues_more_fun(
  account_id: string | null,
  filter: {
    hide_sent: boolean;
    type: SHIT_1170_FEED_TYPE;
    contracts: ReadonlyArray<string>;
  },
  cursor: string | null,
): Promise<{
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>;
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  next_cursor: string | null;
}> {
  if (filter.type === "swaps") {
    return { queues: [], tokens: new Map(), next_cursor: null };
  }
  // --- WHY --- A LIST WITH NO CURSOR IS NOT ASKED FOR AGAIN: the whole
  // match of that list is on screen already, and asking again would
  // fetch the first page a second time.
  if (cursor === null) {
    return { queues: [], tokens: new Map(), next_cursor: null };
  }
  const contracts =
    filter.contracts.length === 0 ? null : filter.contracts.join(",");
  const loaded = await SHIT_1170_APP_PAGE_FEED_LOAD.load(
    account_id,
    filter.hide_sent,
    contracts,
    cursor,
  );
  return {
    queues: loaded.queues,
    tokens: loaded.tokens,
    next_cursor: loaded.next_cursor,
  };
}

// the next page of swaps.
async function load_swaps_more_fun(
  account_id: string | null,
  filter: {
    hide_sent: boolean;
    type: SHIT_1170_FEED_TYPE;
    contracts: ReadonlyArray<string>;
  },
  cursor: string | null,
): Promise<{
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>;
  quotes: SHIT_1170_APP_PAGE_FEED_STORE_STATE["swap_quotes"];
  routes: SHIT_1170_APP_PAGE_FEED_STORE_STATE["swap_routes"];
  balances: SHIT_1170_APP_PAGE_FEED_STORE_STATE["swap_balances"];
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  next_cursor: string | null;
}> {
  if (filter.type === "calls") {
    return {
      swaps: [],
      quotes: [],
      routes: [],
      balances: new Map(),
      tokens: new Map(),
      next_cursor: null,
    };
  }
  // --- WHY --- A LIST WITH NO CURSOR IS NOT ASKED FOR AGAIN: the whole
  // match of that list is on screen already, and asking again would
  // fetch the first page a second time.
  if (cursor === null) {
    return {
      swaps: [],
      quotes: [],
      routes: [],
      balances: new Map(),
      tokens: new Map(),
      next_cursor: null,
    };
  }
  try {
    // --- WHY --- THE NEXT PAGE CARRIES THE SAME CONTRACT FILTER: the
    // next page belongs to the same match as the first one, so a page
    // asked for without the contracts would bring back swaps the
    // reader did not pick.
    const contracts =
      filter.contracts.length === 0 ? null : filter.contracts.join(",");
    const loaded = await SHIT_1170_APP_PAGE_FEED_SWAPS.load(
      account_id,
      filter.hide_sent,
      contracts,
      cursor,
      set_swap_routes_fun,
    );
    return {
      swaps: loaded.swaps,
      quotes: loaded.quotes,
      routes: loaded.routes,
      balances: loaded.balances,
      tokens: loaded.tokens,
      next_cursor: loaded.next_cursor,
    };
  } catch (err) {
    console.warn("[app_page_feed_store] the next swaps page failed", err);
    return {
      swaps: [],
      quotes: [],
      routes: [],
      balances: new Map(),
      tokens: new Map(),
      next_cursor: null,
    };
  }
}

// the total the reader is shown: how many queued transactions the whole
// match holds.
//
// --- WHY --- THE TWO TOTALS ARE ADDED WHEN BOTH KINDS ARE FETCHED: the
// reader sees one feed, and the feed holds both kinds of post, so the
// total is both counts together. the contract filter narrows both
// lists, so each count is already the count of the whole match for the
// reader's filter.
//
// --- WHY --- ONE KIND IS COUNTED ON ITS OWN: the other kind is not
// fetched for that type filter, and its zero must not change the count
// of the kind the reader asked for.
function total_of_fun(
  queues_total: number,
  swaps_total: number,
  type: SHIT_1170_FEED_TYPE,
): number {
  if (type === "calls") return queues_total;
  if (type === "swaps") return swaps_total;
  return queues_total + swaps_total;
}

// the key the current load was for, so a load for an older filter does
// not overwrite a newer one.
//
// --- WHY --- THE SORT AND THE DIRECTION ARE IN THE KEY: they are part
// of the filter, and a load that finished after the reader changed them
// must not overwrite the new filter with the old one.
function filter_key_fun(
  account_id: string | null,
  hide_sent: boolean,
  type: SHIT_1170_FEED_TYPE,
  contracts: ReadonlyArray<string>,
  accounts: ReadonlyArray<string>,
  sort: SHIT_1170_FEED_SORT,
  direction: SHIT_1170_FEED_DIRECTION,
): string {
  return [
    account_id ?? "",
    hide_sent ? "1" : "0",
    type,
    contracts.join(","),
    accounts.join(","),
    sort,
    direction,
  ].join("|");
}
// ========================================
// ========================================
// --- SET -------------------------------
// put the filter on the url.
//
// --- WHY THE URL IS WRITTEN BEFORE THE STATE: the url says what the
// page is showing, and the state and the url must never disagree about
// it.
//
// --- WHY THE DEFAULTS ARE LEFT OFF THE URL: see the url module. the
// sort's default is DATE ADDED and it is not written, and neither is
// the type's ALL or the direction's DESC.
function write_url_fun(
  hide_sent: boolean,
  sort: SHIT_1170_FEED_SORT,
  type: SHIT_1170_FEED_TYPE,
  contracts: ReadonlyArray<string>,
  accounts: ReadonlyArray<string>,
  direction: SHIT_1170_FEED_DIRECTION,
): void {
  const sort_value =
    sort === "date_added"
      ? null
      : SHIT_1170_APP_PAGE_FEED_FILTER.sort_is_known(sort)
        ? sort
        : null;
  const type_value =
    type === "all"
      ? null
      : SHIT_1170_APP_PAGE_FEED_FILTER.type_is_known(type)
        ? type
        : null;
  const dir_value =
    direction === "desc"
      ? null
      : SHIT_1170_APP_PAGE_FEED_FILTER.direction_is_known(direction)
        ? direction
        : null;
  SHIT_1170_APP_PAGE_FEED_URL.write_filter(
    hide_sent,
    sort_value,
    type_value,
    contracts,
    accounts,
    dir_value,
  );
}

// ========================================
// --- HIDE SENT -------------------------
// the reader flipped the hide-sent switch.
//
// --- WHY THE SWITCH IS ALWAYS AVAILABLE: "has this account sent it" is
// a question about ONE account, and the account in play is always the
// reader's own — the backend takes the caller's own account for it.
//
// --- WHY THE URL IS WRITTEN HERE AND NOT ONLY IN THE LOAD: the load
// reads the filter off the url, so the url has to carry the NEW switch
// before the load reads it.
async function set_hide_sent_fun(hide_sent: boolean): Promise<void> {
  if (hide_sent === state.hide_sent) return;
  set_state_fun({ ...state, hide_sent });
  write_url_fun(
    hide_sent,
    state.sort,
    state.type,
    state.contracts,
    state.accounts,
    state.direction,
  );
  await load_fun();
}
// ========================================
// --- SORT ------------------------------
// the reader picked another sort.
//
// --- WHY THE SORT IS DONE ON THE CLIENT: the api has no sort
// parameter, so the order is worked out here over the posts that are
// loaded. the api is still asked for the same list.
//
// --- WHY THE PAGINATION RESETS: the sort is ONE filter, and every
// filter change starts the list again from the first page. a list that
// was paged under one order and then re-sorted is a list whose pages
// do not belong to each other any more.
async function set_sort_fun(sort: SHIT_1170_FEED_SORT): Promise<void> {
  if (sort === state.sort) return;
  set_state_fun({
    ...state,
    sort,
  });
  write_url_fun(
    state.hide_sent,
    sort,
    state.type,
    state.contracts,
    state.accounts,
    state.direction,
  );
  await load_fun();
}
// ========================================
// --- DIRECTION -------------------------
// the reader flipped the direction.
//
// --- WHY THE PAGINATION RESETS: the same reason the sort's does. the
// direction is part of the same one filter.
async function set_direction_fun(
  direction: SHIT_1170_FEED_DIRECTION,
): Promise<void> {
  if (direction === state.direction) return;
  set_state_fun({
    ...state,
    direction,
  });
  write_url_fun(
    state.hide_sent,
    state.sort,
    state.type,
    state.contracts,
    state.accounts,
    direction,
  );
  await load_fun();
}
// ========================================
// --- TYPE ------------------------------
// the reader picked another kind of post.
//
// --- WHY THE TYPE RE-READS THE FEED: it says WHICH KIND of post is
// fetched, so the other kind is not asked for at all. that is half the
// requests for the same screen.
async function set_type_fun(type: SHIT_1170_FEED_TYPE): Promise<void> {
  if (type === state.type) return;
  set_state_fun({ ...state, type });
  write_url_fun(
    state.hide_sent,
    state.sort,
    type,
    state.contracts,
    state.accounts,
    state.direction,
  );
  await load_fun();
}
// ========================================
// --- CONTRACTS -------------------------
// the reader picked or unpicked a contract.
//
// --- WHY THE CONTRACTS RE-READ THE FEED: the api filters the batches by
// contract, so the list on screen is not the list the reader asked for
// until the api is asked again.
//
// --- WHY AN EMPTY LIST IS EVERY CONTRACT: there is nothing to filter
// by, and the api reads a missing contract filter as every contract.
async function set_contracts_fun(
  contracts: ReadonlyArray<string>,
): Promise<void> {
  if (same_list_fun(contracts, state.contracts)) return;
  set_state_fun({ ...state, contracts: [...contracts] });
  write_url_fun(
    state.hide_sent,
    state.sort,
    state.type,
    contracts,
    state.accounts,
    state.direction,
  );
  await load_fun();
}

// ========================================
// --- ACCOUNTS --------------------------
// the reader picked or unpicked an account.
//
// --- WHY THE ACCOUNTS RE-READ THE FEED: the api filters the batches by
// account, so the list on screen is not the list the reader asked for
// until the api is asked again.
//
// --- WHY THE ACCOUNT LIST IS ONE FIELD: the api reads `account_id` as
// ONE comma separated string and reads the values as an OR, so the
// picked accounts are asked for in one go.
async function set_accounts_fun(
  accounts: ReadonlyArray<string>,
): Promise<void> {
  if (same_list_fun(accounts, state.accounts)) return;
  set_state_fun({ ...state, accounts: [...accounts] });
  write_url_fun(
    state.hide_sent,
    state.sort,
    state.type,
    state.contracts,
    accounts,
    state.direction,
  );
  await load_fun();
}

// ========================================
// --- CLEAR -----------------------------
// every filter goes back to its default.
//
// --- WHY THE CLEAR ALSO FORGETS THE SAVED FILTER: the saved filter is
// the reader's own choice, and CLEAR ALL says "no filters". leaving the
// saved one behind would bring it back on the next open.
async function clear_all_fun(): Promise<void> {
  set_state_fun({
    ...state,
    hide_sent: false,
    sort: "date_added",
    direction: "desc",
    type: "all",
    contracts: [],
    accounts: [],
  });
  SHIT_1170_APP_PAGE_FEED_SAVED.write(null);
  write_url_fun(false, "date_added", "all", [], [], "desc");
  await load_fun();
}

// ========================================
// --- SAVE ------------------------------
// remember the filters, so the feed opens the way the reader left it.
//
// --- WHY THE TOAST SAYS SO: saving is quiet work and the reader pressed
// a button that does something they cannot see. a toast tells them it
// happened.
function save_filters_fun(): void {
  SHIT_1170_APP_PAGE_FEED_SAVED.write({
    hide_sent: state.hide_sent,
    sort: state.sort,
    direction: state.direction,
    type: state.type,
    contracts: state.contracts,
    accounts: state.accounts,
  });
  SHIT_1170_TOAST_STORE.show("success", "FILTERS SAVED", null, null);
}
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
// --- HELPERS ----------------------------
// are two lists the same list?
//
// --- WHY --- THE ORDER COUNTS: the reader picks contracts one at a
// time and the list grows, so the order is the order they picked them
// in. two lists with the same entries in another order are not the same
// pick.
function same_list_fun(
  a: ReadonlyArray<string>,
  b: ReadonlyArray<string>,
): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}
// ========================================
// --- WATCH -----------------------------
// follow the auth state, so a sign-in or a sign-out moves the feed.
//
// --- WHY THE FEED WATCHES THE AUTH: the reader's own account is in
// play for the hide-sent filter and for the ME button in the accounts
// group. a reader who signs in while the feed is open wants their own
// queue, and a reader who signs out wants all of it.
function watch_fun(): () => void {
  return SHIT_1170_AUTH.subscribe(() => {
    void load_fun();
  });
}
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_STORE = {
  load: load_fun,
  load_more: load_more_fun,
  refresh: refresh_fun,
  set_hide_sent: set_hide_sent_fun,
  set_sort: set_sort_fun,
  set_direction: set_direction_fun,
  set_type: set_type_fun,
  set_contracts: set_contracts_fun,
  set_accounts: set_accounts_fun,
  clear_all: clear_all_fun,
  save_filters: save_filters_fun,
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
