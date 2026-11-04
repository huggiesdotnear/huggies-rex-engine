// ========================================
// the queue page's REQUESTS.
//
// one file holds every request the page makes, so the page's request
// list is knowable by reading one file.
//
// the queue page asks the tx queue for the ONE batch the url names, and
// the token indexer for the tokens that batch names.
import {
  api_shit_1170_tx_queue_one_get,
  type SHIT_1170_TX_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
import { shit_1170_queue_token_ids_fun } from "../shared/queue_transfers";
import { fetch_transfer_tokens_by_ids_fun } from "../shared/transfer_tokens";
import type { SHIT_1170_TRANSFER_TOKEN } from "../shared/transfer_tokens";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what one load brings back: the batch, and the tokens it names.
export interface SHIT_1170_APP_PAGE_QUEUE_LOADED {
  // the batch on screen.
  queue: SHIT_1170_TX_QUEUE;
  // the token metadata for the transfers the batch makes.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
}
// ========================================
// ========================================
// --- LOAD ------------------------------
// load the batch the url names.
//
// --- WHY THE API KEY RIDES ALONG: the batch is open to anybody, but a
// reader who is signed in gets their own view of it, and the key is how
// the backend knows who is asking.
export async function shit_1170_queue_load_fun(
  queue_id: string,
): Promise<SHIT_1170_APP_PAGE_QUEUE_LOADED> {
  const options = await api_key_options_fun(false);
  const queue = await api_shit_1170_tx_queue_one_get(
    SHIT_1170_BASE_URL,
    queue_id,
    options,
  );
  const tokens = await load_tokens_fun(queue);
  return { queue, tokens };
}

// ========================================
// --- TOKENS ----------------------------
// the token metadata for the transfers the batch makes.
//
// --- WHY ONE CALL FOR THE WHOLE BATCH: a batch of three calls can name
// the same token twice, and one request for the set is one request and
// not three.
//
// --- WHY A FAILURE HERE IS SWALLOWED: the batch is still worth showing
// without its icons. a failure here costs the reader the icon and the
// symbol, and it must not cost them the batch.
async function load_tokens_fun(
  queue: SHIT_1170_TX_QUEUE,
): Promise<Map<string, SHIT_1170_TRANSFER_TOKEN>> {
  const ids = shit_1170_queue_token_ids_fun(queue);
  if (ids.length === 0) return new Map();
  return fetch_transfer_tokens_by_ids_fun(ids);
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_QUEUE_LOAD = {
  load: shit_1170_queue_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
