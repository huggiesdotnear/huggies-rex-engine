// ========================================
// the account page's TRANSACTION DETAILS: the full transactions of the
// account's newest few.
//
// read this file to know what the details section requests.
//
// WHAT THE DETAILS SECTION REQUESTS
//   1. POST /v0/transactions   the full transaction of each of the
//                              account's newest few hashes
//
// WHY IT IS A SEPARATE ENDPOINT FROM THE HISTORY
// --- the history endpoint answers with a ROW per transaction: the
// hash, the time, whether it worked, and how the account was involved.
// it does NOT carry the signer, the receiver or the actions. the
// details endpoint carries those, and it is about thirteen times
// bigger per transaction.
//
// --- WHY ONLY THE NEWEST FEW: the details endpoint takes twenty
// hashes per call, and a full transaction on a busy account runs from
// eight kilobytes at the middle to a hundred at the top. so a hundred
// full transactions is nearly three megabytes and five calls at once,
// which is past what the api's rate limit allows. a card per
// transaction is affordable for a handful of them and not for a list
// that scrolls forever. the list below the cards keeps using the
// history endpoint, which is cheap and pages forever.
//
// THE CACHE
// --- a transaction belongs to no one account — the same one is on
// many accounts' histories — so the details are cached by the
// transaction's hash and every account shares them.
//
// --- WHY A SETTLED TRANSACTION'S DETAILS NEVER CHANGE: the hash is
// the hash of a transaction that already happened, and what it did
// cannot be different later. a transaction that has NOT settled yet
// can still change, so a pending one is not kept.
import {
  api_transactions,
  parse_transaction,
  TRANSACTIONS_BATCH_SIZE,
} from "@sleet-js/fastnear-explorer-api-client";
import { SHIT_1170_TX_DETAIL_CACHE } from "./app_page_account_tx_details_cache";
import type { SHIT_1170_CACHED_TX_DETAIL } from "./app_page_account_tx_details_cache";
import type { PARSE_RESULT } from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how many of the account's newest transactions get a card.
//
// --- WHY FIVE: the details endpoint takes twenty hashes per call, so
// five is one request, and five cards is enough to show what the
// account has been doing without the section taking over the page.
const SHIT_1170_TX_DETAIL_COUNT = 5;
// ========================================
// ========================================
// --- TYPES ------------------------------
// one transaction, parsed and ready to render.
export interface SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL {
  // the transaction's hash.
  hash: string;
  // the parsed transaction — the flat shape the card renders.
  parsed: PARSE_RESULT;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// whether a transaction has settled.
//
// --- WHY --- A PENDING TRANSACTION'S DETAILS CAN STILL CHANGE: it has
// not run yet, so its outcome and its receipts are not final. a
// settled one can never change, so it is safe to keep.
function is_settled_fun(parsed: PARSE_RESULT): boolean {
  return parsed.is_success !== null;
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// the full detail of some transactions, by their hashes.
//
// the cache is read first: the hashes that are already there cost
// nothing. the ones that are missing go to the api in batches of
// twenty, and the answers are written to the cache.
//
// --- WHY THE MISSING ONES GO IN ONE BATCH: the endpoint takes twenty
// hashes per call, so twenty hashes are one request and one request
// is one round trip.
//
// --- WHY A SETTLED TRANSACTION IS ONLY CACHED: a pending one can
// still change, so keeping it would show a reader something that has
// already moved on.
export async function load_tx_details_fun(
  hashes: ReadonlyArray<string>,
): Promise<SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL[]> {
  if (hashes.length === 0) return [];
  const wanted = hashes.slice(0, SHIT_1170_TX_DETAIL_COUNT);
  // the ones the cache already has.
  const cached = await SHIT_1170_TX_DETAIL_CACHE.get_many(wanted);
  const missing: string[] = [];
  // the cached ones, by hash, so the answer can be put back in the
  // order it was asked for.
  const by_hash: Map<string, SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL> = new Map();
  for (const hash of wanted) {
    const entry = cached.get(hash);
    if (entry === undefined) {
      missing.push(hash);
      continue;
    }
    const parsed = parse_transaction(entry.detail);
    by_hash.set(hash, { hash, parsed });
  }
  if (missing.length === 0) {
    return wanted
      .map((hash) => by_hash.get(hash))
      .filter(
        (item): item is SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL =>
          item !== undefined,
      );
  }

  const to_cache: SHIT_1170_CACHED_TX_DETAIL[] = [];
  for (
    let index = 0;
    index < missing.length;
    index += TRANSACTIONS_BATCH_SIZE
  ) {
    const batch = missing.slice(index, index + TRANSACTIONS_BATCH_SIZE);
    const response = await api_transactions({
      tx_hashes: batch,
    });
    for (const transaction of response.transactions) {
      const parsed = parse_transaction(transaction);
      by_hash.set(parsed.hash, { hash: parsed.hash, parsed });
      if (is_settled_fun(parsed)) {
        to_cache.push({
          id: parsed.hash,
          detail: transaction,
          fetched_at: Date.now(),
        });
      }
    }
  }
  await SHIT_1170_TX_DETAIL_CACHE.put_many(to_cache);
  // --- WHY --- THE ANSWER IS PUT BACK IN THE ORDER IT WAS ASKED FOR:
  // the hashes come from the history newest first, and the cached ones
  // and the fetched ones have to go back in that same order. adding
  // the fetched ones to the front would shuffle the cards whenever
  // only some of them were missing.
  return wanted
    .map((hash) => by_hash.get(hash))
    .filter(
      (item): item is SHIT_1170_APP_PAGE_ACCOUNT_TX_DETAIL =>
        item !== undefined,
    );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
