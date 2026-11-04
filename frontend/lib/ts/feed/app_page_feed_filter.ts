// ========================================
// the feed page's filter: the view, the account, the hide-sent switch
// and the sort.
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
import type {
  SHIT_1170_APP_PAGE_FEED_STATE,
  SHIT_1170_FEED_SORT,
  SHIT_1170_FEED_VIEW,
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
  "newest",
  "most_accounts",
];

// is this a sort the feed offers?
export function shit_1170_feed_sort_is_known_fun(value: string): boolean {
  return (SHIT_1170_FEED_SORTS as ReadonlyArray<string>).includes(value);
}
// ========================================
// ========================================
// --- READ ------------------------------
// the filter the url carries.
//
// --- WHY --- THE SIGNED-IN ACCOUNT IS THE DEFAULT: a reader who signs
// in wants their own queue, so the MINE view is the one they land on.
// a reader who is signed out has no queue of their own, so they land
// on the ALL view.
//
// --- WHY --- THE HIDE-SENT SWITCH IS OFF WHEN THERE IS NO ACCOUNT: it
// filters the reader's own sent queues, and without an account there
// is nothing to filter.
export function shit_1170_feed_filter_read_fun(): {
  view: SHIT_1170_FEED_VIEW;
  account_id: string | null;
  hide_sent: boolean;
  sort: SHIT_1170_FEED_SORT;
} {
  const account_id = SHIT_1170_APP_PAGE_FEED_URL.read_account();
  const signed_in = SHIT_1170_AUTH.get_account_id();
  // --- WHY --- THE MINE VIEW IS THE DEFAULT WHEN THERE IS AN ACCOUNT:
  // the url's account says whose queues are shown, and the signed-in
  // account is the fallback for a link that names none. a reader who is
  // signed out has no queue of their own, so they land on the ALL view.
  const mine_account = account_id ?? signed_in;
  const view: SHIT_1170_FEED_VIEW = mine_account === null ? "all" : "mine";
  const hide_sent =
    view === "mine" ? SHIT_1170_APP_PAGE_FEED_URL.read_hide_sent() : false;
  const sort_raw = SHIT_1170_APP_PAGE_FEED_URL.read_sort(
    shit_1170_feed_sort_is_known_fun,
  );
  const sort: SHIT_1170_FEED_SORT =
    sort_raw === null ? "newest" : (sort_raw as SHIT_1170_FEED_SORT);
  return {
    view,
    account_id: view === "mine" ? mine_account : null,
    hide_sent,
    sort,
  };
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// the account the feed is about, or null for the ALL view.
//
// --- WHY --- THE MINE VIEW CARRIES THE ACCOUNT AND THE ALL VIEW
// CARRIES NONE: the url's account says whose queues are shown, and in
// the ALL view there is no such account. writing one would put a
// filter on the link that the page does not apply.
export function shit_1170_feed_account_of_fun(
  state: SHIT_1170_APP_PAGE_FEED_STATE,
): string | null {
  return state.view === "mine" ? state.account_id : null;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_FILTER = {
  read: shit_1170_feed_filter_read_fun,
  account_of: shit_1170_feed_account_of_fun,
  sort_is_known: shit_1170_feed_sort_is_known_fun,
  sorts: SHIT_1170_FEED_SORTS,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
