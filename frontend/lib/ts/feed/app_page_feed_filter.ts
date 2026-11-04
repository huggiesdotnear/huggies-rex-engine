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
  const sort: SHIT_1170_FEED_SORT =
    sort_raw === null ? "newest" : (sort_raw as SHIT_1170_FEED_SORT);
  return {
    view,
    // --- WHY --- THE ACCOUNT IS KEPT IN THE ALL VIEW TOO: it is the
    // reader's own account, and it is what the MINE view filters by.
    // dropping it would lose the reader's account when they flip back.
    account_id: mine_account,
    hide_sent,
    sort,
  };
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
