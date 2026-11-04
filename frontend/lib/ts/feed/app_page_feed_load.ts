// ========================================
// the feed page's REQUESTS.
//
// one file holds every request the page makes, so the page's request
// list is knowable by reading one file.
//
// the feed asks the tx queue for the batches, and the token indexer for
// the tokens those batches name.
import {
  api_shit_1170_tx_queue_get,
  type SHIT_1170_TX_QUEUE_QUERY,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
import {
  shit_1170_queue_token_ids_fun,
  type SHIT_1170_QUEUE_TRANSFER,
} from "../shared/queue_transfers";
import { fetch_transfer_tokens_by_ids_fun } from "../shared/transfer_tokens";
import type { SHIT_1170_TRANSFER_TOKEN } from "../shared/transfer_tokens";
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what one load brings back: the batches, and the tokens they name.
export interface SHIT_1170_APP_PAGE_FEED_LOADED {
  // the batches on screen.
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>;
  // the token metadata for the transfers the batches make.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
}
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how many batches the feed asks for.
//
// --- WHY --- the backend's own default is 50, and the feed asks for
// the same: a feed of fifty is a screen or two, and the queue page
// carries the rest.
const SHIT_1170_FEED_LIMIT = 50;
// ========================================
// ========================================
// --- QUERY -----------------------------
// the query the feed's filter makes.
//
// --- WHY --- `hide_sent` GOES OUT ONLY WITH AN ACCOUNT: "has this
// account sent it" is a question about ONE account, and the backend
// answers a 400 for the filter without one.
//
// --- WHY --- `account_id` GOES OUT ONLY IN THE MINE VIEW: the ALL view
// is every queue, and asking for one account's queues would be a
// different view.
export function shit_1170_feed_query_fun(
  account_id: string | null,
  hide_sent: boolean,
): SHIT_1170_TX_QUEUE_QUERY {
  const query: SHIT_1170_TX_QUEUE_QUERY = { limit: SHIT_1170_FEED_LIMIT };
  if (account_id === null) return query;
  query.account_id = account_id;
  if (hide_sent) query.hide_sent = true;
  return query;
}
// ========================================
// ========================================
// --- LOAD ------------------------------
// load the feed: the batches, and the tokens they name.
//
// --- WHY THE TOKENS ARE ASKED FOR IN ONE CALL: a batch of three calls
// can name the same token twice, and one request for the set is one
// request and not three.
//
// --- WHY THE API KEY RIDES ALONG: the queue list is open, but a reader
// who is signed in gets their own view of it, and the key is how the
// backend knows who is asking.
export async function shit_1170_feed_load_fun(
  account_id: string | null,
  hide_sent: boolean,
): Promise<SHIT_1170_APP_PAGE_FEED_LOADED> {
  const options = await api_key_options_fun(false, account_id ?? undefined);
  const result = await api_shit_1170_tx_queue_get(
    SHIT_1170_BASE_URL,
    shit_1170_feed_query_fun(account_id, hide_sent),
    options,
  );
  const queues = result.items;
  const tokens = await load_tokens_fun(queues);
  return { queues, tokens };
}

// ========================================
// --- TOKENS ----------------------------
// the token metadata for the transfers a set of batches makes.
//
// --- WHY A FAILURE HERE IS SWALLOWED: the batches are still worth
// showing without their icons. a failure here costs the reader the icon
// and the symbol, and it must not cost them the feed.
async function load_tokens_fun(
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>,
): Promise<Map<string, SHIT_1170_TRANSFER_TOKEN>> {
  const ids: string[] = [];
  for (const queue of queues) {
    for (const id of shit_1170_queue_token_ids_fun(queue)) ids.push(id);
  }
  if (ids.length === 0) return new Map();
  return fetch_transfer_tokens_by_ids_fun(ids);
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_LOAD = {
  load: shit_1170_feed_load_fun,
  query: shit_1170_feed_query_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================

// the transfer reading's type is re-exported so the components that
// draw a transfer do not have to reach into the shared module for it.
export type { SHIT_1170_QUEUE_TRANSFER };
