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
import { SHIT_1170_APP_PAGE_FEED_WS } from "./app_page_feed_ws";
import {
  shit_1170_feed_ws_queue_matches_fun,
  shit_1170_feed_ws_swap_matches_fun,
} from "./app_page_feed_ws_match";
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
import { SHIT_1170_SWAP_LIVE_ROUTES } from "../shared/swap_live_routes";
import { SHIT_1170_SWAP_BALANCES } from "../shared/swap_balances";
import { fetch_transfer_tokens_by_ids_fun } from "../shared/transfer_tokens";
import { shit_1170_queue_token_ids_fun } from "../shared/queue_transfers";
import type {
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_TX_QUEUE,
  SHIT_1170_TX_QUEUE_FACETS,
} from "@huggies/shit-1170-rex-engine-middleman";
import type { SHIT_1170_FEED_WS_EVENT } from "@huggies/shit-1170-rex-engine-middleman";
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
  // how many posts have arrived live since the reader last looked at
  // the top of the feed.
  //
  // --- WHY --- THE COUNT IS HELD AND NOT JUST SHOWN: a post that lands
  // at the top of a newest-first list is OFF SCREEN when the reader has
  // scrolled down to page two, and a post that appears silently is a
  // post the reader never sees. so the count is held, and the feed
  // shows it until the reader goes back to the top.
  new_posts: number;
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
  new_posts: 0,
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
// the posts that arrived LIVE and that no load has caught up with yet.
//
// --- WHY --- THEY ARE HELD BESIDE THE STATE AND NOT INSIDE IT: a load
// REPLACES the list with what the api answered, and the api's answer
// was made before the live post was queued. so a post that arrives
// while a load is on its way would be thrown away by that load's answer,
// and the reader would have to reload to see it. these are the posts
// that a load has not caught up with, and every load merges them back
// in.
//
// --- WHY --- THEY ARE TWO LISTS AND NOT ONE: the queued batches and the
// queued swaps are two resources with two ids, and a post is one or the
// other.
let pending_queues: ReadonlyArray<SHIT_1170_TX_QUEUE> = [];
let pending_swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE> = [];
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
  // --- WHY --- THE LIVE SOCKET IS OPENED HERE AND NOT IN THE START
  // SCRIPT: the socket is the feed's live half, and the feed's live
  // half starts when the feed starts. the start script is the page's
  // first load, and this IS the page's first load — but the load also
  // runs again when the reader changes a filter, and opening the socket
  // again then would push every event twice.
  //
  // --- WHY --- THE SOCKET IS NOT CLOSED AND REOPENED ON A FILTER
  // CHANGE: the socket is FILTER-AGNOSTIC — it pushes every new post
  // and the client decides what matches — so the match check reads the
  // CURRENT filter off the state when the event arrives. a filter
  // change therefore costs nothing on the wire.
  //
  // --- WHY --- OPENING IT TWICE IS A NO-OP: the open is guarded by the
  // socket module, so the second load of the page finds the socket
  // already open and leaves it alone.
  SHIT_1170_APP_PAGE_FEED_WS.open(handle_feed_event_fun);
  // --- WHY --- THE PENDING POSTS ARE MATCHED AGAIN AGAINST THE NEW
  // FILTER: they were matched against the filter that was on screen when
  // they arrived, and the reader may have changed it since. a post that
  // the new filter does not want is dropped, and a post that it does
  // want is kept — so a filter change never shows a post the reader did
  // not ask for.
  pending_queues = pending_queues.filter((queue) =>
    shit_1170_feed_ws_queue_matches_fun(
      queue,
      {
        hide_sent: filter.hide_sent,
        type: filter.type,
        contracts: filter.contracts,
        accounts: filter.accounts,
      },
      SHIT_1170_AUTH.get_account_id(),
    ),
  );
  pending_swaps = pending_swaps.filter((swap) =>
    shit_1170_feed_ws_swap_matches_fun(
      swap,
      {
        hide_sent: filter.hide_sent,
        type: filter.type,
        contracts: filter.contracts,
        accounts: filter.accounts,
      },
      SHIT_1170_AUTH.get_account_id(),
    ),
  );
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
    // --- WHY --- THE NEW-POST COUNT GOES BACK TO ZERO ON A LOAD: the
    // load brings the whole first page, so everything that arrived live
    // is on screen now and there is nothing left to announce.
    new_posts: 0,
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
    // --- WHY --- THE PENDING POSTS ARE MERGED IN: a post that arrived
    // live while this load was on its way is NOT in what the api
    // answered — the api's answer was made before the post was queued.
    // so the load would throw it away, and the reader would have to
    // reload to see it. the pending posts go back in.
    const merged = merge_pending_fun(loaded.queues, swaps_loaded.swaps);
    // --- WHY --- THE PENDING SWAPS BRING THEIR OWN SLOTS: the quote
    // and the route arrays are PARALLEL to `swaps`, so a swap that
    // joins the list has to bring a slot in BOTH of them. a pending
    // swap has no route in the slot the load made for it — the load
    // only knows about the swaps the api answered with — so it starts
    // with a null quote and no routes, exactly like a swap that has
    // just joined the list, and its own live routes are taken again
    // below.
    const pending_swap_slots = merged.pending_swaps.map(() => null);
    const pending_route_slots = merged.pending_swaps.map(() => []);
    set_state_fun({
      ...state,
      hide_sent: filter.hide_sent,
      sort: filter.sort,
      direction: filter.direction,
      type: filter.type,
      contracts: filter.contracts,
      accounts: filter.accounts,
      queues: merged.queues,
      // --- WHY --- THE LOADED TOKENS ARE MERGED WITH THE ONES ALREADY
      // HELD: the live posts brought their own tokens, and the load's
      // answer does not carry them.
      tokens: new Map([...state.tokens, ...loaded.tokens]),
      swaps: merged.swaps,
      swap_quotes: [...swaps_loaded.quotes, ...pending_swap_slots],
      swap_routes: [...swaps_loaded.routes, ...pending_route_slots],
      // --- WHY --- THE BALANCES AND THE SWAP TOKENS ARE MERGED AND NOT
      // REPLACED: the live swaps brought their own, and the load's
      // answer does not carry them.
      swap_balances: new Map([
        ...state.swap_balances,
        ...swaps_loaded.balances,
      ]),
      swap_tokens: new Map([...state.swap_tokens, ...swaps_loaded.tokens]),
      total: total_of_fun(loaded.total, swaps_loaded.total, filter.type),
      next_cursor: queues_cursor,
      swaps_cursor: swaps_cursor,
      loading_more: false,
      loading: false,
      facets: facets ?? state.facets,
      error: null,
    });
    // --- WHY --- THE PENDING LIST IS CLEARED AFTER THE LOAD: the load
    // has caught up with the posts that were queued before it asked, and
    // the posts that arrived after it asked are still pending — so only
    // the ones the api's answer carries are let go of.
    pending_queues = merged.pending_queues;
    pending_swaps = merged.pending_swaps;
    // --- WHY --- THE PENDING SWAPS GET THEIR ROUTES AGAIN: the load
    // gave the list new slots and the live routes are held by slot, so
    // the live swap asks for its route once more and it lands in the
    // slot the new list has for it. only the ROUTES are taken again —
    // the tokens and the balance are already held and the load did not
    // take them away.
    for (const pending of merged.pending_swaps) {
      void load_live_swap_routes_fun(pending, SHIT_1170_AUTH.get_account_id());
    }
  } catch (err) {
    if (loaded_for !== key) return;
    loading = false;
    queues_cursor = null;
    swaps_cursor = null;
    // --- WHY --- THE PENDING POSTS SURVIVE A FAILED LOAD: they arrived
    // live and they are real — the load failed, not the posts. so the
    // reader keeps the posts the socket brought them and loses only the
    // pages the api could not answer.
    set_state_fun({
      ...state,
      queues: [...pending_queues],
      swaps: [...pending_swaps],
      swap_quotes: pending_swaps.map(() => null),
      swap_routes: pending_swaps.map(() => []),
      // --- WHY --- THE TOKENS AND THE BALANCES ARE KEPT: they were
      // fetched for the pending posts and they are still true.
      swap_balances: new Map(state.swap_balances),
      tokens: new Map(state.tokens),
      swap_tokens: new Map(state.swap_tokens),
      new_posts: 0,
      total: pending_queues.length + pending_swaps.length,
      next_cursor: null,
      swaps_cursor: null,
      loading_more: false,
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
    // --- WHY --- THE PENDING SWAPS GET THEIR ROUTES AGAIN: the error
    // path gave the list new slots and the live routes are held by slot.
    for (const pending of pending_swaps) {
      void load_live_swap_routes_fun(pending, SHIT_1170_AUTH.get_account_id());
    }
  }
} // ========================================
// ========================================
// --- MERGE PENDING ---------------------
// put the posts that arrived live back into what a load answered.
//
// --- WHY --- THE LOAD'S ANSWER IS A SNAPSHOT FROM BEFORE THE POST WAS
// QUEUED: the api answered the question it was asked, and the post that
// arrived live while the answer was on its way was queued after the
// question was asked. so the answer does not carry it, and the load
// would drop it.
//
// --- WHY --- A POST THE ANSWER ALREADY CARRIES IS NOT PUT IN TWICE: a
// post that was queued before the load asked IS in the answer, and the
// reader must see it once.
//
// --- WHY --- THE PENDING LIST IS ONLY SHRUNK AND NEVER GROWN HERE: a
// post that arrived while the load was on its way is still pending, so
// the next load merges it in again — and the answer will carry it by
// then, and it is let go of.
//
// --- WHY --- THE PENDING POSTS ARE APPENDED AND NOT PUT FIRST: the
// merge sorts the list, so the order of the list does not matter. the
// pages are in the order the api sent them and the live posts come
// after them, and the sort puts everything where the reader expects it.
function merge_pending_fun(
  loaded_queues: ReadonlyArray<SHIT_1170_TX_QUEUE>,
  loaded_swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>,
): {
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>;
  swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>;
  pending_queues: ReadonlyArray<SHIT_1170_TX_QUEUE>;
  pending_swaps: ReadonlyArray<SHIT_1170_SWAP_QUEUE>;
} {
  const loaded_queue_ids = new Set(loaded_queues.map((queue) => queue.queueId));
  const loaded_swap_ids = new Set(loaded_swaps.map((swap) => swap.swapId));
  // --- WHY --- THE PENDING POSTS THE ANSWER DOES NOT CARRY STAY
  // PENDING: they were queued after the api was asked, so the answer
  // does not have them — and the next load will.
  const keep_queues = pending_queues.filter(
    (queue) => !loaded_queue_ids.has(queue.queueId),
  );
  const keep_swaps = pending_swaps.filter(
    (swap) => !loaded_swap_ids.has(swap.swapId),
  );
  return {
    // --- WHY --- THE PENDING POSTS GO AFTER THE ANSWER: the merge sorts
    // the list, so the order of the list does not matter — and the
    // pages are in the order the api sent them.
    queues: [...loaded_queues, ...keep_queues],
    swaps: [...loaded_swaps, ...keep_swaps],
    pending_queues: keep_queues,
    pending_swaps: keep_swaps,
  };
}
// ========================================
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
// --- WHY THE SWAP IS FOUND BY ITS ID AND NOT BY ITS POSITION: the
// quote and the routes are held in arrays PARALLEL to `swaps`, and the
// position of a swap in them changes — a live swap joins the list, the
// next page is appended to it, a reload replaces it. a subscription
// that fires late would then write into the WRONG slot and the card
// would show another swap's route. the id is the one thing about a
// swap that does not move.
//
// --- WHY A SWAP THAT IS NOT THERE IS IGNORED: a subscription for a
// swap that has left the screen must not write into the next swap's
// slot. a swap that is not in the list has no slot at all, so there is
// nothing to write into.
//
// --- WHY --- THE QUOTE IS REBUILT FROM THE ROUTE: the quote IS the
// route's numbers, so when the route changes the numbers change too.
// reading them off the route means the amount on the card and the route
// the button signs can never disagree.
function set_swap_routes_fun(
  swap_id: string,
  routes: ReadonlyArray<SHIT_1170_SWAP_ROUTE>,
): void {
  const index = state.swaps.findIndex((swap) => swap.swapId === swap_id);
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
// --- LIVE FEED -------------------------
// the socket is open, and a new post arrived.
//
// --- WHY THE EVENT IS HANDLED AND NOT THE POSTS: the event is either
// a queued batch or a queued swap, and the two need different work — a
// batch needs its tokens, a swap needs its quote, its routes, its live
// subscription, its tokens and its balance. so the event is split and
// each kind is given its own handling.
//
// --- WHY THE MATCH IS READ OFF THE STATE AND NOT OFF THE URL: the
// state IS the filter that is on screen. the url carries what the
// reader picked, and the state carries the same thing plus the
// defaults — so reading the state cannot answer a question about a
// filter the reader has already left.
//
// --- WHY THE MATCH READS THE READER'S OWN ACCOUNT AT THIS MOMENT: the
// hide-sent filter is about the reader's OWN account, and the reader
// may have signed in since the page opened. so the account is read now
// and not captured when the socket opened.
function handle_feed_event_fun(event: SHIT_1170_FEED_WS_EVENT): void {
  const filter = {
    hide_sent: state.hide_sent,
    type: state.type,
    contracts: state.contracts,
    accounts: state.accounts,
  };
  const own_account_id = SHIT_1170_AUTH.get_account_id();
  if (event.type === "queue") {
    if (
      !shit_1170_feed_ws_queue_matches_fun(event.queue, filter, own_account_id)
    ) {
      return;
    }
    add_live_queue_fun(event.queue);
    return;
  }
  if (!shit_1170_feed_ws_swap_matches_fun(event.swap, filter, own_account_id)) {
    return;
  }
  add_live_swap_fun(event.swap);
}
// ========================================
// ========================================
// --- LIVE QUEUE ------------------------
// a new queued batch joins the feed.
//
// --- WHY THE BATCH IS APPENDED AND NOT PUT AT THE TOP: the LIST on
// screen is not the order the reader sees. `build_posts_fun` merges
// the batches and the swaps and sorts them by the time they were
// queued, so the batch lands in the right place on its own — and the
// direction decides whether that is the top or the bottom. the LIST
// keeps the order the pages were loaded in, so the cursors and the
// pages stay consistent.
//
// --- WHY A BATCH THE READER ALREADY HAS IS NOT ADDED TWICE: the socket
// pushes a batch when it is QUEUED, and a reload may have already
// brought it in. two copies of one batch would show the reader the
// same post twice, and the count would be wrong too.
//
// --- WHY THE TOKENS ARE ASKED FOR AFTERWARDS: the card's call line
// shows the token's icon and symbol, and those come from the token
// indexer. the batch itself is already on screen by then — the tokens
// arrive a moment later and the card fills in.
function add_live_queue_fun(queue: SHIT_1170_TX_QUEUE): void {
  if (state.queues.some((one) => one.queueId === queue.queueId)) return;
  // --- WHY --- THE POST IS ALSO HELD AS PENDING: a load that is on its
  // way replaces the list with what the api answered, and the api's
  // answer was made before this post was queued. so the post is held
  // here until a load has caught up with it.
  pending_queues = [...pending_queues, queue];
  set_state_fun({
    ...state,
    queues: [...state.queues, queue],
    total: state.total + 1,
    new_posts: state.new_posts + 1,
  });
  void load_live_queue_tokens_fun(queue);
}
// ========================================
// ========================================
// --- LIVE QUEUE TOKENS -----------------
// the token metadata for a batch that arrived live.
//
// --- WHY A FAILURE HERE IS SWALLOWED: the batch is still worth
// showing without its icons. a failure costs the reader the icon and
// the symbol, and it must not cost them the feed.
async function load_live_queue_tokens_fun(
  queue: SHIT_1170_TX_QUEUE,
): Promise<void> {
  const ids = shit_1170_queue_token_ids_fun(queue);
  if (ids.length === 0) return;
  const tokens = await fetch_transfer_tokens_by_ids_fun(ids);
  if (tokens.size === 0) return;
  // --- WHY --- THE TOKENS ARE MERGED AND NOT REPLACED: the map holds
  // the tokens of EVERY batch on screen, and the other batches' tokens
  // are in it already.
  set_state_fun({
    ...state,
    tokens: new Map([...state.tokens, ...tokens]),
  });
}
// ========================================
// ========================================
// --- LIVE SWAP -------------------------
// a new queued swap joins the feed.
//
// --- WHY THE SWAP IS APPENDED AND NOT PUT AT THE TOP: the same reason
// the live batch is appended — the merge sorts the list, and the swap
// lands in the right place on its own.
//
// --- WHY THE SWAP IS APPENDED WITH ITS OWN SLOT IN THE QUOTE AND THE
// ROUTE ARRAYS: those two arrays are PARALLEL to `swaps` — the same
// order and the same length — and the card reads its quote and its
// route by index. so a swap that joins the list has to bring a slot
// with it, and the slot has to be the same slot in BOTH arrays.
//
// --- WHY THE ROUTES ARE TAKEN AND NOT LEFT EMPTY: the card's SWAP NOW
// button signs the route the card is showing, and a card with no route
// has an off button. the live swap gets its route the same way a loaded
// one does — the one-shot fetch fills the screen and the subscription
// keeps it fresh.
function add_live_swap_fun(swap: SHIT_1170_SWAP_QUEUE): void {
  if (state.swaps.some((one) => one.swapId === swap.swapId)) return;
  // --- WHY --- THE POST IS ALSO HELD AS PENDING: a load that is on its
  // way replaces the list with what the api answered, and the api's
  // answer was made before this post was queued. so the post is held
  // here until a load has caught up with it.
  pending_swaps = [...pending_swaps, swap];
  set_state_fun({
    ...state,
    swaps: [...state.swaps, swap],
    // --- WHY --- A NULL QUOTE AND AN EMPTY ROUTE LIST ARE THE SLOTS'
    // PLACEHOLDERS: the quote is null when the router could not answer
    // and the routes are empty when there is nothing to sign. the card
    // falls back to the quote the backend stored.
    swap_quotes: [...state.swap_quotes, null],
    swap_routes: [...state.swap_routes, []],
    total: state.total + 1,
    new_posts: state.new_posts + 1,
  });
  void load_live_swap_parts_fun(swap);
}
// ========================================
// ========================================
// --- LIVE SWAP PARTS -------------------
// the tokens, the balance, the quote and the live routes of a swap that
// arrived live.
//
// --- WHY IT IS THE SAME WORK A LOADED SWAP GETS: a swap that arrives
// live must look exactly like a swap that arrived with the page, or the
// reader gets a card with no icon, no number and an off button for a
// trade they can perfectly well make.
async function load_live_swap_parts_fun(
  swap: SHIT_1170_SWAP_QUEUE,
): Promise<void> {
  const own_account_id = SHIT_1170_AUTH.get_account_id();
  await Promise.all([
    load_live_swap_tokens_fun(swap),
    load_live_swap_balance_fun(swap, own_account_id),
    load_live_swap_routes_fun(swap, own_account_id),
  ]);
}
// ========================================
// ========================================
// --- LIVE SWAP TOKENS -----------------
// the token metadata for a swap that arrived live.
//
// --- WHY A FAILURE HERE IS SWALLOWED: the swap is still worth showing
// without its icons.
async function load_live_swap_tokens_fun(
  swap: SHIT_1170_SWAP_QUEUE,
): Promise<void> {
  const ids = [...new Set([swap.tokenIn, swap.tokenOut])];
  if (ids.length === 0) return;
  const tokens = await fetch_transfer_tokens_by_ids_fun(ids);
  if (tokens.size === 0) return;
  // --- WHY --- THE TOKENS ARE MERGED AND NOT REPLACED: the map holds
  // the tokens of EVERY swap on screen.
  set_state_fun({
    ...state,
    swap_tokens: new Map([...state.swap_tokens, ...tokens]),
  });
}
// ========================================
// ========================================
// --- LIVE SWAP BALANCE ----------------
// the reader's balance of the token a live swap sells.
//
// --- WHY ONLY THE TOKEN IN: the token in is the one that LEAVES the
// reader's wallet, so it is the one the balance has to cover.
//
// --- WHY THE ACCOUNT IS THE READER'S OWN: a balance belongs to a
// wallet, and the wallet in play is the reader's.
//
// --- WHY A FAILURE HERE IS SWALLOWED: the swap is still worth showing.
// it costs the reader the balance check and not the card.
async function load_live_swap_balance_fun(
  swap: SHIT_1170_SWAP_QUEUE,
  account_id: string | null,
): Promise<void> {
  if (account_id === null) return;
  try {
    const balances = await SHIT_1170_SWAP_BALANCES.load(account_id, [
      swap.tokenIn,
    ]);
    set_state_fun({
      ...state,
      swap_balances: new Map([...state.swap_balances, ...balances]),
    });
  } catch (err) {
    console.warn(
      "[app_page_feed_store] the live swap's balance could not be read",
      err,
    );
  }
}
// ========================================
// ========================================
// --- LIVE SWAP ROUTES ------------------
// the live quote and the live routes of a swap that arrived live.
//
// --- WHY THE ONE-SHOT FETCH COMES FIRST AND THE SUBSCRIPTION AFTER: the
// socket takes a moment to open and to answer, so the card would show
// nothing until it does. the fetch fills the screen immediately and the
// socket takes over.
//
// --- WHY THE SWAP'S OWN SLOT IS FOUND BY ITS ID: the quote and the
// routes are held in arrays PARALLEL to `swaps`, and the position of
// the swap in them is not a fixed thing — the list grows while the
// reader is on it. the id finds the swap wherever it sits, so the
// numbers land in the slot the card reads from.
//
// --- WHY A FAILURE HERE IS SWALLOWED: the router is a third party. the
// swap is still worth showing without its live numbers, and the
// backend's stored quote is the fallback.
async function load_live_swap_routes_fun(
  swap: SHIT_1170_SWAP_QUEUE,
  account_id: string | null,
): Promise<void> {
  try {
    const live = await SHIT_1170_SWAP_LIVE_ROUTES.load(
      [
        {
          token_in: swap.tokenIn,
          token_out: swap.tokenOut,
          amount_in: swap.amountIn,
        },
      ],
      account_id,
      (routes_index, routes) => {
        // --- WHY --- THE BATCH'S OWN INDEX IS IGNORED AND THE SWAP'S OWN
        // ID IS USED: the one-shot load was asked for ONE swap, so its
        // index is always zero, and the id is the one thing that says
        // WHICH swap the routes belong to.
        void routes_index;
        set_swap_routes_fun(swap.swapId, routes);
      },
    );
    const one = live[0];
    if (one === undefined) return;
    // --- WHY --- THE SLOT IS FOUND AGAIN HERE: the routes may have
    // arrived while the fetch was in flight, and the swap may have
    // moved in the list while the fetch was in flight. so the slot is
    // looked up again here rather than remembered.
    const index = state.swaps.findIndex((one) => one.swapId === swap.swapId);
    if (index < 0) return;
    // --- WHY --- THE QUOTE AND THE ROUTES GO INTO THE SWAP'S OWN SLOT:
    // the arrays are parallel to `swaps`, and the slot is where the
    // card reads them from.
    const swap_quotes = [...state.swap_quotes];
    const swap_routes = [...state.swap_routes];
    swap_quotes[index] = one.quote;
    swap_routes[index] = one.routes;
    set_state_fun({ ...state, swap_quotes, swap_routes });
  } catch (err) {
    console.warn(
      "[app_page_feed_store] the live swap's routes could not be taken",
      err,
    );
  }
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
// --- NEW POSTS -------------------------
// the reader went back to the top of the feed, so the new posts are on
// screen and there is nothing left to announce.
//
// --- WHY --- THE COUNT GOES TO ZERO AND THE POSTS STAY: the posts are
// already in the list, and the count is only ever a way of saying "there
// are posts above where you are". the reader has been there, so the
// count has said what it had to say.
function clear_new_posts_fun(): void {
  if (state.new_posts === 0) return;
  set_state_fun({ ...state, new_posts: 0 });
}
// ========================================
// --- CLOSE -----------------------------
// the page is going away, so the live feed stops.
//
// --- WHY --- THE SOCKET IS CLOSED HERE: a socket that is left open
// keeps pushing events into a page that is no longer there, and the
// reconnects keep it alive. the feed holds one socket and the page
// holds the store, so this is where the socket is let go of.
function close_fun(): void {
  SHIT_1170_APP_PAGE_FEED_WS.close();
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
  clear_new_posts: clear_new_posts_fun,
  close: close_fun,
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
