// ========================================
// the transaction page's load: one transaction, fully expanded.
//
// read this file to know what the transaction page requests.
//
// WHAT THE PAGE REQUESTS
//   1. POST /v0/transactions   the transaction by its hash, from the
//                              fastnear tx api
//
// the api answers with the transaction, its receipts and their
// outcomes. the parser in the fastnear client turns that into the
// flat shape the page renders — the signer, the receiver, the
// actions, the transfers and the success state.
//
// --- WHY THE PARSER IS USED AND NOT THE RAW SHAPE: the raw shape is
// nested and every screen of it would have to reach into it. the
// parser is pure and it does the nesting once, so the page's
// components read flat fields.
import {
  api_transactions,
  parse_transaction,
} from "@sleet-js/fastnear-explorer-api-client";
import type {
  PARSE_RESULT,
  TRANSACTION_DETAIL,
} from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what the page holds about one transaction.
export interface HUGGIES_APP_PAGE_TX_DATA {
  // the parsed transaction — the flat shape the page renders.
  parsed: PARSE_RESULT;
  // the untouched transaction, so nothing is ever lost.
  raw: TRANSACTION_DETAIL;
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load one transaction by its hash.
//
// --- WHY THE HASH IS CHECKED FOR BLANKNESS HERE: the page's url can
// carry `?tx=` with nothing after it, and an empty hash would ask the
// api for a transaction that does not exist. the caller treats a null
// result as "there is no transaction to show".
async function app_page_tx_load_fun(
  tx_hash: string,
): Promise<HUGGIES_APP_PAGE_TX_DATA | null> {
  const trimmed = tx_hash.trim();
  if (trimmed.length === 0) return null;
  const response = await api_transactions({
    tx_hashes: [trimmed],
  });
  const transaction = response.transactions[0];
  // the api answers with fewer transactions than asked for when a hash
  // is unknown. that is not a failure — it is a hash nobody has.
  if (transaction === undefined) return null;
  return {
    parsed: parse_transaction(transaction),
    raw: transaction,
  };
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_TX = {
  load: app_page_tx_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
