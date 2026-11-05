// ========================================
// the feed page's filter: the hide-sent switch, the sort, the direction,
// the type and the picked contracts and accounts.
//
// the filter is ONE thing — what the feed is showing — so it lives in
// one place, and the store, the url and the filter bar all speak about
// it through here.
import { SHIT_1170_APP_PAGE_FEED_URL } from "./app_page_feed_url";
import { SHIT_1170_APP_PAGE_FEED_SAVED } from "./app_page_feed_saved";
import {
  SHIT_1170_APP_PAGE_FEED_DEFAULTS,
  type SHIT_1170_FEED_DIRECTION,
  type SHIT_1170_FEED_SORT,
  type SHIT_1170_FEED_TYPE,
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
  hide_sent: boolean;
  sort: SHIT_1170_FEED_SORT;
  direction: SHIT_1170_FEED_DIRECTION;
  type: SHIT_1170_FEED_TYPE;
  contracts: ReadonlyArray<string>;
  accounts: ReadonlyArray<string>;
} {
  const hide_sent_raw = SHIT_1170_APP_PAGE_FEED_URL.read_hide_sent();
  const sort_raw = SHIT_1170_APP_PAGE_FEED_URL.read_sort(
    shit_1170_feed_sort_is_known_fun,
  );
  const type_raw = SHIT_1170_APP_PAGE_FEED_URL.read_type(
    shit_1170_feed_type_is_known_fun,
  );
  const dir_raw = SHIT_1170_APP_PAGE_FEED_URL.read_dir(
    shit_1170_feed_direction_is_known_fun,
  );
  // --- WHY --- THE SAVED FILTER FILLS IN THE SORT, THE TYPE, THE
  // DIRECTION AND THE SWITCH TOO: they are the same saved choice as the
  // lists, and a reader who saved MOST POPULAR with the sent queues
  // hidden wants both when they come back. the url still wins, so a link
  // somebody pasted is the link's filter and not the reader's saved one.
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
    // --- WHY --- THE SWITCH FALLS BACK TO THE SAVED ONE ONLY WHEN THE
    // URL SAYS NOTHING ABOUT IT: the url is the link somebody pasted,
    // and a link with no `?hide_sent=` says nothing about the switch.
    // a link that says `?hide_sent=1` says yes and nothing may fill it
    // in.
    hide_sent:
      hide_sent_raw ??
      saved?.hide_sent ??
      SHIT_1170_APP_PAGE_FEED_DEFAULTS.hide_sent,
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
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_FILTER = {
  read: shit_1170_feed_filter_read_fun,
  saved_done: shit_1170_feed_filter_saved_done_fun,
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
