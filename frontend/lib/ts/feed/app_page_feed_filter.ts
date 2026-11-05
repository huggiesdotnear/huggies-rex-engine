// ========================================
// the feed page's filter: the view, the account, the hide-sent switch,
// the sort, the direction, the type and the picked contracts and
// accounts.
//
// the filter is ONE thing — what the feed is showing — so it lives in
// one place, and the store, the url and the filter bar all speak about
// it through here.
//
// --- WHY THE ACCOUNT AND THE VIEW ARE SEPARATE THINGS: the ALL view
// has no account, because there is nobody to be "sent by" in it. the
// MINE view has one, and it is the reader's. so the view says which
// question is being asked, and the account says who it is about.
import { SHIT_1170_AUTH } from "../shared/auth_status";
import { SHIT_1170_APP_PAGE_FEED_URL } from "./app_page_feed_url";
import { SHIT_1170_APP_PAGE_FEED_SAVED } from "./app_page_feed_saved";
import {
  SHIT_1170_APP_PAGE_FEED_DEFAULTS,
  type SHIT_1170_APP_PAGE_FEED_STATE,
  type SHIT_1170_FEED_DIRECTION,
  type SHIT_1170_FEED_SORT,
  type SHIT_1170_FEED_TYPE,
  type SHIT_1170_FEED_VIEW,
} from "./app_page_feed_types";
// ========================================
// ========================================
// --- SORTS -----------------------------
// the sorts the feed offers.
//
// --- WHY --- the set is here and not in the component: the url has to
// know which sort names are real, so a hand-edited link cannot put the
// page in a sort it does not have.
const SHIT_1170_FEED_SORTS: ReadonlyArray<SHIT_1170_FEED_SORT> = [
  "date_added",
  "most_popular",
];

// is this a sort the feed offers?
export function shit_1170_feed_sort_is_known_fun(value: string): boolean {
  return (SHIT_1170_FEED_SORTS as ReadonlyArray<string>).includes(value);
}
// ========================================
// ========================================
// --- TYPES -----------------------------
// the kinds of post the feed offers.
//
// --- WHY --- the set is here and not in the component: the url has to
// know which type names are real, so a hand-edited link cannot put the
// page in a type it does not have.
const SHIT_1170_FEED_TYPES: ReadonlyArray<SHIT_1170_FEED_TYPE> = [
  "all",
  "calls",
  "swaps",
];

// is this a type the feed offers?
export function shit_1170_feed_type_is_known_fun(value: string): boolean {
  return (SHIT_1170_FEED_TYPES as ReadonlyArray<string>).includes(value);
}
// ========================================
// ========================================
// --- DIRECTIONS ------------------------
// the two directions the feed orders by.
//
// --- WHY --- the set is here and not in the component: the url has to
// know which direction names are real, so a hand-edited link cannot put
// the page in a direction it does not have.
const SHIT_1170_FEED_DIRECTIONS: ReadonlyArray<SHIT_1170_FEED_DIRECTION> = [
  "asc",
  "desc",
];

// is this a direction the feed offers?
export function shit_1170_feed_direction_is_known_fun(value: string): boolean {
  return (SHIT_1170_FEED_DIRECTIONS as ReadonlyArray<string>).includes(value);
}
// ========================================
// ========================================
// --- READ ------------------------------
// the filter the url carries, with the saved filter as the fallback.
//
// --- WHY --- THE SIGNED-IN ACCOUNT IS THE DEFAULT: a reader who signs
// in wants their own queue, so the MINE view is the one they land on.
// a reader who is signed out has no queue of their own, so they land
// on the ALL view.
//
// --- WHY --- THE HIDE-SENT SWITCH IS OFF WHEN THERE IS NO ACCOUNT: it
// filters the reader's own sent queues, and without an account there
// is nothing to filter.
//
// --- WHY --- THE SAVED FILTER IS THE FALLBACK AND NOT THE FIRST: the
// url is the LINK, so a link somebody pasted must win over what the
// reader saved earlier. the saved filter only fills in what the url
// does not say.
//
// --- WHY --- THE SAVED FILTER IS ONLY USED ON THE FIRST READ: the
// reader's own choices are in the url once they have made them, and a
// url that says "every contract" says so because they picked it. so the
// saved filter is read when the page opens and never again.
export function shit_1170_feed_filter_read_fun(): {
  view: SHIT_1170_FEED_VIEW;
  account_id: string | null;
  hide_sent: boolean;
  sort: SHIT_1170_FEED_SORT;
  direction: SHIT_1170_FEED_DIRECTION;
  type: SHIT_1170_FEED_TYPE;
  contracts: ReadonlyArray<string>;
  accounts: ReadonlyArray<string>;
} {
  const account_id = SHIT_1170_APP_PAGE_FEED_URL.read_account();
  const signed_in = SHIT_1170_AUTH.get_account_id();
  // --- WHY --- THE VIEW COMES OFF THE URL AND IS NOT GUESSED FROM THE
  // ACCOUNT: the reader picks ALL, the url says so, and the account
  // stays on the url because it still says whose queues the MINE view
  // would show. if the view were guessed from the account, picking ALL
  // would be undone the moment the url was read back.
  //
  // --- WHY --- THE ACCOUNT IS THE FALLBACK FOR A LINK THAT NAMES NO
  // VIEW: a link with no view param is a link made before the view was
  // a parameter of its own, and it means "the reader's own queues".
  const url_view = SHIT_1170_APP_PAGE_FEED_URL.read_view();
  const mine_account = account_id ?? signed_in;
  const view: SHIT_1170_FEED_VIEW =
    url_view === "all"
      ? "all"
      : url_view === "mine"
        ? "mine"
        : mine_account === null
          ? "all"
          : "mine";
  const hide_sent =
    view === "mine" ? SHIT_1170_APP_PAGE_FEED_URL.read_hide_sent() : false;
  const sort_raw = SHIT_1170_APP_PAGE_FEED_URL.read_sort(
    shit_1170_feed_sort_is_known_fun,
  );
  const type_raw = SHIT_1170_APP_PAGE_FEED_URL.read_type(
    shit_1170_feed_type_is_known_fun,
  );
  const dir_raw = SHIT_1170_APP_PAGE_FEED_URL.read_dir(
    shit_1170_feed_direction_is_known_fun,
  );
  // --- WHY --- THE SAVED FILTER FILLS IN THE SORT, THE TYPE AND THE
  // DIRECTION TOO: they are the same saved choice as the lists, and a
  // reader who saved MOST POPULAR wants MOST POPULAR when they come
  // back. the url still wins, so a link somebody pasted is the link's
  // view and not the reader's saved one.
  const saved = saved_applies_fun()
    ? SHIT_1170_APP_PAGE_FEED_SAVED.read()
    : null;
  const sort: SHIT_1170_FEED_SORT =
    sort_raw !== null
      ? (sort_raw as SHIT_1170_FEED_SORT)
      : (saved?.sort ?? SHIT_1170_APP_PAGE_FEED_DEFAULTS.sort);
  const type: SHIT_1170_FEED_TYPE =
    type_raw !== null
      ? (type_raw as SHIT_1170_FEED_TYPE)
      : (saved?.type ?? SHIT_1170_APP_PAGE_FEED_DEFAULTS.type);
  const direction: SHIT_1170_FEED_DIRECTION =
    dir_raw !== null
      ? (dir_raw as SHIT_1170_FEED_DIRECTION)
      : (saved?.direction ?? SHIT_1170_APP_PAGE_FEED_DEFAULTS.direction);
  // --- WHY --- THE LISTS ARE READ OFF THE URL AND FALL BACK TO THE
  // SAVED ONES ONLY ON THE FIRST READ: a url that names a contract is a
  // link somebody made and it must win over what the reader saved. a
  // url that names none leaves the reader's saved list alone — but only
  // while the page is opening. after that the reader's own picks are in
  // the url, and a url that says nothing means "every contract".
  const url_contracts = SHIT_1170_APP_PAGE_FEED_URL.read_contracts();
  const url_accounts = SHIT_1170_APP_PAGE_FEED_URL.read_accounts();
  const contracts = url_contracts ?? saved?.contracts ?? [];
  const accounts = url_accounts ?? saved?.accounts ?? [];
  return {
    view,
    // --- WHY --- THE ACCOUNT IS KEPT IN THE ALL VIEW TOO: it is the
    // reader's own account, and it is what the MINE view filters by.
    // dropping it would lose the reader's account when they flip back.
    account_id: mine_account,
    hide_sent,
    sort,
    direction,
    type,
    contracts,
    accounts,
  };
}
// ========================================
// ========================================
// --- SAVED -----------------------------
// does the saved filter still apply?
//
// --- WHY --- THE FLAG IS CLEARED AFTER THE FIRST READ: the reader's
// own picks go on the url as soon as they make them, and from then on
// the url is the truth. the saved filter fills in the blanks only
// while the page is opening.
let saved_applies = true;

function saved_applies_fun(): boolean {
  return saved_applies;
}

// the saved filter stops applying.
export function shit_1170_feed_filter_saved_done_fun(): void {
  saved_applies = false;
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// the account the feed is about, or null for the ALL view.
//
// --- WHY --- THE ACCOUNT IS ONLY SENT IN THE MINE VIEW: the api filters
// the queues by account, and in the ALL view there is no account to
// filter by. the url still carries the account — it is the reader's,
// and it is what the MINE view filters by when they flip back — but
// the REQUEST does not.
export function shit_1170_feed_account_of_fun(
  state: SHIT_1170_APP_PAGE_FEED_STATE,
): string | null {
  return state.view === "mine" ? state.account_id : null;
}

// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_FILTER = {
  read: shit_1170_feed_filter_read_fun,
  saved_done: shit_1170_feed_filter_saved_done_fun,
  account_of: shit_1170_feed_account_of_fun,
  sort_is_known: shit_1170_feed_sort_is_known_fun,
  type_is_known: shit_1170_feed_type_is_known_fun,
  direction_is_known: shit_1170_feed_direction_is_known_fun,
  sorts: SHIT_1170_FEED_SORTS,
  types: SHIT_1170_FEED_TYPES,
  directions: SHIT_1170_FEED_DIRECTIONS,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
