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
  type SHIT_1170_TX_QUEUE,
  type SHIT_1170_TX_QUEUE_QUERY,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
import { SHIT_1170_AUTH } from "../shared/auth_status";
import {
  shit_1170_queue_token_ids_fun,
  type SHIT_1170_QUEUE_TRANSFER,
} from "../shared/queue_transfers";
import { fetch_transfer_tokens_by_ids_fun } from "../shared/transfer_tokens";
import type { SHIT_1170_TRANSFER_TOKEN } from "../shared/transfer_tokens";
// ========================================
// --- TYPES ------------------------------
// what one load brings back: the batches, and the tokens they name.
export interface SHIT_1170_APP_PAGE_FEED_LOADED {
  // the batches on screen.
  queues: ReadonlyArray<SHIT_1170_TX_QUEUE>;
  // the token metadata for the transfers the batches make.
  tokens: Map<string, SHIT_1170_TRANSFER_TOKEN>;
  // how many batches the WHOLE match holds, before the cursor took its
  // cut.
  total: number;
  // the cursor of the NEXT page, or null when this page is the last
  // one.
  next_cursor: string | null;
}
// ========================================
// --- CONFIG -----------------------------
// how many batches the feed asks for.
//
// --- WHY --- it is a hundred and not fifty: the feed pages by cursor
// and asks for the next page when the reader nears the bottom, so a
// hundred is two screens of work for one request. the earlier fifty was
// half of what the backend could answer in one go, and the rest of the
// answer was thrown away.
const SHIT_1170_FEED_LIMIT = 100;
// ========================================
// ========================================
// --- QUERY -----------------------------
// the query the feed's filter makes.
//
// --- WHY `hide_sent` GOES OUT WITH AN ACCOUNT: "has this account sent
// it" is a question about ONE account, and the backend answers a 400
// for the filter without one. the account is the reader's own, and the
// backend takes the caller's own account for the filter — so the picked
// accounts list is not what the switch is about.
//
// --- WHY `account_id` IS THE PICKED ACCOUNTS LIST: the api reads ONE
// comma separated value and reads the values as an OR, so the reader's
// picked accounts go out as the one string.
//
// --- WHY `contract_id` IS A COMMA SEPARATED STRING: the route reads ONE
// value per param, and one string carries many values. the api reads
// them as an OR.
//
// --- WHY THE CURSOR GOES OUT UNTOUCHED: it is the backend's own opaque
// page point, and only the backend can read it back.
export function shit_1170_feed_query_fun(
  account_id: string | null,
  hide_sent: boolean,
  contracts: string | null,
  cursor: string | null,
): SHIT_1170_TX_QUEUE_QUERY {
  const query: SHIT_1170_TX_QUEUE_QUERY = { limit: SHIT_1170_FEED_LIMIT };
  if (contracts !== null) query.contract_id = contracts;
  if (cursor !== null) query.cursor = cursor;
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
// who is signed in has their own history, and the key is how the
// backend knows who is asking.
//
// --- WHY THE KEY IS THE READER'S OWN AND NOT THE PICKED LIST: the
// picked accounts are a comma separated LIST and a key belongs to ONE
// account. asking for the key of the list finds nothing, and the call
// goes out with no key at all — and then the backend cannot tell that
// the `hide_sent` filter is about the reader's own account.
//
// --- WHY THE ACCOUNT IS THE READER'S OWN: the backend takes the
// caller's own account for the `hide_sent` filter and only falls back
// to the first picked account when there is no key. so the key is what
// decides whose history the switch is about.
export async function shit_1170_feed_load_fun(
  account_id: string | null,
  hide_sent: boolean,
  contracts: string | null,
  cursor: string | null,
): Promise<SHIT_1170_APP_PAGE_FEED_LOADED> {
  const options = await api_key_options_fun(
    false,
    SHIT_1170_AUTH.get_account_id() ?? undefined,
  );
  const result = await api_shit_1170_tx_queue_get(
    SHIT_1170_BASE_URL,
    shit_1170_feed_query_fun(account_id, hide_sent, contracts, cursor),
    options,
  );
  const queues = result.items;
  const tokens = await load_tokens_fun(queues);
  return {
    queues,
    tokens,
    total: result.total,
    next_cursor: result.nextCursor,
  };
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
