// ========================================
// the account transactions cache: the transaction rows of an account,
// kept in indexeddb so the second visit to the transactions tab is
// instant.
//
// WHY A CACHE AT ALL
// --- an account's history only grows. a row that has been seen stays
// true: that transaction happened at that height. so the cache can
// hold the rows and only the NEW ones have to be fetched.
//
// --- WHY IT IS KEYED BY ACCOUNT ID AND NOT BY TRANSACTION HASH: the
// rows are read as a list, in order, for one account. a hash-keyed
// store would have to be read whole and sorted, and the list is what
// the page wants.
//
// the indexeddb mechanics live in lib/ts/indexed_db_store.ts — this
// file only says WHICH store this cache is and what a row looks like.
import { HUGGIES_INDEXED_DB_STORE } from "../shared/indexed_db_store";
// ========================================
const HUGGIES_ACCOUNT_TX_DB_NAME = "huggies_account_transactions";
const HUGGIES_ACCOUNT_TX_DB_VERSION = 1;
const HUGGIES_ACCOUNT_TX_STORE = "account_transactions";
// ========================================
// the cache's identity, handed to the shared store module.
const HUGGIES_ACCOUNT_TX_STORE_CONFIG = {
  db_name: HUGGIES_ACCOUNT_TX_DB_NAME,
  db_version: HUGGIES_ACCOUNT_TX_DB_VERSION,
  store_name: HUGGIES_ACCOUNT_TX_STORE,
};
// ========================================
// ========================================
// --- SHAPE ------------------------------
// one row in the account transactions store, keyed by `id` — the
// account id.
//
// the rows are the account's transactions, newest first, exactly as
// the api handed them over. `resume_token` is the api's own cursor: it
// says where the NEXT page starts, so the next page can be asked for
// without asking for the pages before it.
//
// --- WHY `fetched_at` IS STORED: a history that only grows means the
// cached rows never go stale, but the CURSOR can go stale — the api's
// resume token points at a position in a history that has moved on.
// the age of the cache says whether the cursor is still worth sending
// or whether the list should be fetched afresh.
export interface HUGGIES_CACHED_ACCOUNT_TRANSACTIONS {
  id: string;
  rows: ReadonlyArray<HUGGIES_CACHED_ACCOUNT_TX_ROW>;
  resume_token: string | null;
  txs_count: number;
  fetched_at: number;
}
// ========================================
// one transaction row as the cache holds it.
//
// it is the api's own row, kept field for field. the cache stores the
// api's shape rather than a shape of our own so a cached row and a
// fresh row are the same thing and the table cannot tell them apart.
export interface HUGGIES_CACHED_ACCOUNT_TX_ROW {
  account_id: string;
  transaction_hash: string;
  tx_block_height: number;
  tx_block_timestamp: string;
  tx_index: number;
  is_success: boolean;
  is_signer: boolean;
  is_receiver: boolean;
  is_real_signer: boolean;
  is_real_receiver: boolean;
  is_predecessor: boolean;
  is_function_call: boolean;
  is_any_signer: boolean;
  is_delegated_signer: boolean;
  is_event_log: boolean;
  is_action_arg: boolean;
  is_explicit_refund_to: boolean;
}
// ========================================
// ========================================
// --- READ ------------------------------
// the cached history of one account; null when there is none.
//
// resolves null on any db failure, so a cache problem degrades to a
// refetch instead of an error the ui has to handle.
async function get_cached_account_transactions_fun(
  id: string,
): Promise<HUGGIES_CACHED_ACCOUNT_TRANSACTIONS | null> {
  const found =
    await HUGGIES_INDEXED_DB_STORE.get_many<HUGGIES_CACHED_ACCOUNT_TRANSACTIONS>(
      HUGGIES_ACCOUNT_TX_STORE_CONFIG,
      [id],
    );
  return found.get(id) ?? null;
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// upsert one account's history. never throws: a failed cache write
// only costs a refetch next time.
async function put_cached_account_transactions_fun(
  entry: HUGGIES_CACHED_ACCOUNT_TRANSACTIONS,
): Promise<void> {
  await HUGGIES_INDEXED_DB_STORE.put_many(
    HUGGIES_ACCOUNT_TX_STORE_CONFIG,
    [entry],
  );
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the cache surface. exported as one object so callers have a single
// import; every function is safe to call in a non-browser (returns null
// / no-ops) so components never need to guard.
export const HUGGIES_ACCOUNT_TX_CACHE = {
  get: get_cached_account_transactions_fun,
  put: put_cached_account_transactions_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
