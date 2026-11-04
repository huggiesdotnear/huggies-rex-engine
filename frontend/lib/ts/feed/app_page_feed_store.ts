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
import { SHIT_1170_APP_PAGE_FEED_URL } from "./app_page_feed_url";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import type {
  SHIT_1170_APP_PAGE_FEED_STATE,
  SHIT_1170_FEED_SORT,
  SHIT_1170_FEED_VIEW,
} from "./app_page_feed_types";
import type { SHIT_1170_TRANSFER_TOKEN } from "../shared/transfer_tokens";
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the state the store holds, plus the tokens the batches name.
export interface SHIT_1170_APP_PAGE_FEED_STORE_STATE extends SHIT_1170_APP_PAGE_FEED_STATE {
  // the token metadata for the transfers the batches make.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
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
  tokens: new Map(),
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
// --- SORT ------------------------------
// the batches, ordered the way the reader asked for.
//
// --- WHY THE SORT IS DONE HERE AND NOT BY THE API: the api has no
// sort parameter for the queue list, and the loaded list is small
// enough that sorting it costs nothing.
//
// --- WHY NEWEST IS BY CREATION TIME: that is when the batch was
// queued, and a feed of queued work reads newest-first.
//
// --- WHY MOST ACCOUNTS IS BY THE NUMBER OF ACCOUNTS: a queue with more
// accounts on it has more people waiting for it, and that is what a
// social feed measures.
function sorted_queues_fun(
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>,
  sort: SHIT_1170_FEED_SORT,
): ReadonlyArray<SHIT_1170_TX_QUEUE> {
  const out = [...queues];
  if (sort === "most_accounts") {
    out.sort((a, b) => b.accounts.length - a.accounts.length);
    return out;
  }
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out;
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
  // the screen does.
  write_url_fun(account_id, filter.hide_sent, filter.sort);
  const key = `${account_id ?? ""}|${filter.hide_sent ? "1" : "0"}`;
  if (loading && loaded_for === key) return;
  loaded_for = key;
  loading = true;
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
    // a load for an older filter must not overwrite a newer one.
    if (loaded_for !== key) return;
    loading = false;
    set_state_fun({
      ...state,
      view: filter.view,
      account_id: filter.account_id,
      hide_sent: filter.hide_sent,
      sort: filter.sort,
      queues: sorted_queues_fun(loaded.queues, filter.sort),
      tokens: loaded.tokens,
      loading: false,
      error: null,
    });
  } catch (err) {
    if (loaded_for !== key) return;
    loading = false;
    set_state_fun({
      ...state,
      queues: [],
      tokens: new Map(),
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
} // ========================================
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
  SHIT_1170_APP_PAGE_FEED_URL.write_filter(account_id, hide_sent, sort_value);
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
    write_url_fun(account_id, state.hide_sent, state.sort);
  } else {
    set_state_fun({ ...state, view, account_id: null, hide_sent: false });
    write_url_fun(null, false, state.sort);
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
    queues: sorted_queues_fun(state.queues, sort),
  });
  write_url_fun(
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
  watch: watch_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
