// ========================================
// the transaction details cache: the FULL detail of a transaction,
// kept in indexeddb so a transaction the reader has already looked at
// is not fetched again.
//
// WHY A CACHE AT ALL
// --- the details endpoint is big. a full transaction is about six
// kilobytes with its receipts and their logs, and the endpoint takes
// twenty hashes per call. so the details are worth keeping: the same
// transaction is fetched once and every later look at it is free.
//
// WHY IT IS KEYED BY TRANSACTION HASH
// --- a transaction belongs to no one account. the same transaction is
// on many accounts' histories — the signer, the receiver, the
// contract that ran it — so a cache keyed by account would hold the
// same transaction several times over. keyed by the hash, it is held
// once and shared.
//
// --- WHY THE ACCOUNT'S ROWS ARE CACHED SEPARATELY: the rows are a
// LIST for one account, in order, and the list is what the account's
// history is. the details are one thing per transaction. two different
// shapes, two different stores.
//
// the indexeddb mechanics live in lib/ts/indexed_db_store.ts — this
// file only says WHICH store this cache is and what a row looks like.
import { HUGGIES_INDEXED_DB_STORE } from "./indexed_db_store";
import type { TRANSACTION_DETAIL } from "@sleet-js/fastnear-explorer-api-client";
// ========================================
const HUGGIES_TX_DETAIL_DB_NAME = "huggies_tx_details";
const HUGGIES_TX_DETAIL_DB_VERSION = 1;
const HUGGIES_TX_DETAIL_STORE = "tx_details";
// ========================================
// the cache's identity, handed to the shared store module.
const HUGGIES_TX_DETAIL_STORE_CONFIG = {
  db_name: HUGGIES_TX_DETAIL_DB_NAME,
  db_version: HUGGIES_TX_DETAIL_DB_VERSION,
  store_name: HUGGIES_TX_DETAIL_STORE,
};
// ========================================
// ========================================
// --- SHAPE ------------------------------
// one transaction's detail in the cache, keyed by `id` — the
// transaction hash.
//
// --- WHY --- `fetched_at` IS THERE: it says when the transaction was
// fetched. a transaction that has SETTLED never changes, so its entry
// is good forever and the age is not consulted for it. a transaction
// that has NOT settled can still change, so it is not cached at all —
// and the age is what would decide if that ever changed.
export interface HUGGIES_CACHED_TX_DETAIL {
  id: string;
  // the api's own answer for that hash, kept whole. it is the NESTED
  // shape, not the parsed one: the parser is pure and cheap, so the
  // raw is kept and parsed on the way out. that way one cached entry
  // serves every reader of it.
  detail: TRANSACTION_DETAIL;
  fetched_at: number;
}
// ========================================
// ========================================
// --- READ ------------------------------
// the cached details of some transactions.
//
// the hashes that are not cached are simply absent from the returned
// map, and that is the caller's signal to fetch them.
//
// resolves empty on any db failure, so a cache problem degrades to a
// refetch instead of an error the ui has to handle.
async function get_cached_tx_details_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, HUGGIES_CACHED_TX_DETAIL>> {
  return HUGGIES_INDEXED_DB_STORE.get_many<HUGGIES_CACHED_TX_DETAIL>(
    HUGGIES_TX_DETAIL_STORE_CONFIG,
    ids,
  );
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// upsert some transactions' details. never throws: a failed cache
// write only costs a refetch next time.
async function put_cached_tx_details_fun(
  entries: ReadonlyArray<HUGGIES_CACHED_TX_DETAIL>,
): Promise<void> {
  await HUGGIES_INDEXED_DB_STORE.put_many(
    HUGGIES_TX_DETAIL_STORE_CONFIG,
    entries,
  );
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the cache surface. exported as one object so callers have a single
// import; every function is safe to call in a non-browser (returns an
// empty map / no-ops) so components never need to guard.
export const HUGGIES_TX_DETAIL_CACHE = {
  get_many: get_cached_tx_details_fun,
  put_many: put_cached_tx_details_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
