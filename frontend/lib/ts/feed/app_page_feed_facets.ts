// ========================================
// the feed page's FACETS: the contracts and the accounts that have
// queued work.
//
// the filter bar's CONTRACTS and ACCOUNTS groups are built from these.
// they cannot be hardcoded and they cannot be made up as the reader
// types: the bar can only offer a button for a contract that really has
// something queued on it.
//
// --- WHY IT IS ASKED FOR ONCE WHEN THE PAGE OPENS: the facets are a
// summary of the WHOLE queue and they do not change when a filter
// changes. asking again on every filter change would be a request per
// click for the same answer.
//
// --- WHY IT LIVES IN THE FEED'S OWN FOLDER AND NOT IN THE LOADER: the
// loader is the FEED, and the facets are the FILTER BAR's list. the
// rule is that a page's folder holds the page's requests, and this is
// one of them.
import {
  api_shit_1170_tx_queue_facets_get,
  type SHIT_1170_TX_QUEUE_FACETS,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
// ========================================
// --- CONFIG -----------------------------
// how many contracts and how many accounts the bar offers.
//
// --- WHY --- it is the backend's own default of 40: the bar is a
// filter, not a directory, and a reader who needs the fortieth contract
// is reading the list and not filtering it. the row scrolls anyway, so
// nothing is lost but the height of the panel.
const SHIT_1170_FEED_FACETS_LIMIT = 40;
// ========================================
// ========================================
// --- LOAD ------------------------------
// the contracts and the accounts that have queued work.
//
// --- WHY THE API KEY RIDES ALONG WHEN THERE IS ONE: the route is open
// and does not need the key, but a reader who is signed in gets their
// own view of the queue and the key is how the backend knows who is
// asking.
export async function shit_1170_feed_facets_load_fun(): Promise<SHIT_1170_TX_QUEUE_FACETS> {
  const options = await api_key_options_fun(false);
  return await api_shit_1170_tx_queue_facets_get(
    SHIT_1170_BASE_URL,
    { limit: SHIT_1170_FEED_FACETS_LIMIT },
    options,
  );
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_FACETS = {
  load: shit_1170_feed_facets_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
