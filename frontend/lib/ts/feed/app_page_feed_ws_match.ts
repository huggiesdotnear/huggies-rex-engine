// ========================================
// the feed's LIVE MATCH: does a new post belong in the reader's feed?
//
// the live socket pushes EVERY new post — the backend does not know
// what the reader's filter is, and it does not need to. so the client
// has to answer the same question the api's list route answers: would
// this post have been in this list?
//
// --- WHY THIS IS ONE FILE AND NOT PART OF THE STORE: the answer is a
// rule about a post and a filter, and both of them change. the rule
// itself does not, so it lives here where it can be read on its own.
//
// --- WHY THE RULE MIRRORS THE BACKEND'S LIST ROUTE: the reader must
// not see a live post that a reload would have hidden, and must not
// miss one that a reload would have shown. so the two answers have to
// be the same answer, and the backend's sql is what they are read off.
//
//   the backend's sql:  src/backend/logic/endpoint_shit_1170_tx_queue/
//                       tx_queue_store.rs  (tx_queue_list_fun)
//                       src/backend/logic/endpoint_shit_1170_swap_queue/
//                       swap_queue_store.rs  (swap_queue_list_fun)
import type {
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_TX_QUEUE,
} from "@huggies/shit-1170-rex-engine-middleman";
import type {
  SHIT_1170_FEED_TYPE,
  SHIT_1170_APP_PAGE_FEED_STATE,
} from "./app_page_feed_types";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the filter the live posts are matched against.
//
// --- WHY --- IT IS THE STATE'S OWN FILTER AND NOT A NEW SHAPE: the
// filter is ONE thing, and the store already holds it. a second copy
// of it could drift from the one on screen, and a live post that
// matched a stale filter would be a post the reader did not ask for.
export type SHIT_1170_FEED_WS_FILTER = Pick<
  SHIT_1170_APP_PAGE_FEED_STATE,
  "hide_sent" | "type" | "contracts" | "accounts"
>;
// ========================================
// ========================================
// --- TYPE ------------------------------
// does the KIND of post match the reader's type filter?
//
// --- WHY --- A QUEUE IS A CALL AND A SWAP IS A SWAP: the feed's TYPE
// group is ALL, FUNCTION CALL and SWAPS, and the api is asked for one
// kind or the other. a queued batch of function calls is a CALL and a
// queued swap is a SWAP, and neither is the other.
//
// --- WHY --- "all" MATCHES BOTH: the ALL filter is not the absence of
// a choice — it is the choice of both kinds.
function type_matches_fun(
  type: SHIT_1170_FEED_TYPE,
  is_swap: boolean,
): boolean {
  if (type === "all") return true;
  if (type === "swaps") return is_swap;
  return !is_swap;
}
// ========================================
// ========================================
// --- ACCOUNTS --------------------------
// does the post carry one of the picked accounts?
//
// --- WHY --- THE WHO IS THE POST'S OWN ACCOUNT ROWS: a batch holds one
// account row per account on it, and the swap holds one row per
// account on it. the picked accounts are the ones the reader chose in
// the ACCOUNTS group.
//
// --- WHY --- AN EMPTY LIST MATCHES EVERY POST: the backend binds the
// account filter only when the list is not empty, so an empty list is
// every account and not "no accounts".
function accounts_match_fun(
  post_accounts: ReadonlyArray<{ accountId: string }>,
  picked: ReadonlyArray<string>,
): boolean {
  if (picked.length === 0) return true;
  for (const account of post_accounts) {
    if (picked.includes(account.accountId)) return true;
  }
  return false;
}
// ========================================
// ========================================
// --- CONTRACTS -------------------------
// does the post touch one of the picked contracts?
//
// --- WHY --- A BATCH'S CONTRACTS ARE ITS TRANSACTIONS' CONTRACTS: the
// backend's contract filter is an `EXISTS` over the transaction rows,
// not over the account rows. a batch holds a transaction for a contract
// even when nobody has sent it yet.
//
// --- WHY --- A SWAP'S CONTRACTS ARE BOTH ITS TOKENS: the token in and
// the token out ARE contract ids, and the backend's swap filter matches
// a swap when EITHER of its two tokens is a picked contract. a filter
// that only looked at one side would hide half of what the reader
// asked for.
function contracts_match_fun(
  post_contracts: ReadonlyArray<string>,
  picked: ReadonlyArray<string>,
): boolean {
  if (picked.length === 0) return true;
  for (const contract of post_contracts) {
    if (picked.includes(contract)) return true;
  }
  return false;
}
// ========================================
// ========================================
// --- HIDE SENT -------------------------
// has the READER already sent this post?
//
// --- WHY --- THE HIDE-SENT FILTER IS ABOUT THE READER'S OWN ACCOUNT:
// "has this account sent it" is a question about ONE account, and the
// backend takes the caller's own account for the filter — the picked
// accounts list is not what the switch is about.
//
// --- WHY --- A ROW WITH A HASH IS A SENT ONE: the hash is written
// when somebody signs and reports it, so a row that carries a hash is
// history and the backend's `NOT EXISTS (... AND tx_hash IS NOT NULL)`
// is exactly this question.
//
// --- WHY --- A POST THE READER IS NOT ON MATCHES: there is no row for
// them, so there is nothing they could have sent.
function hide_sent_matches_fun(
  post_accounts: ReadonlyArray<{ accountId: string; txHash: string | null }>,
  own_account_id: string | null,
  hide_sent: boolean,
): boolean {
  if (!hide_sent) return true;
  if (own_account_id === null) return true;
  for (const account of post_accounts) {
    if (account.accountId !== own_account_id) continue;
    if (account.txHash !== null) return false;
  }
  return true;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// does this queued BATCH belong in the reader's feed?
//
// --- WHY THE ACCOUNT ROWS ARE TAKEN FROM THE BATCH'S OWN WHO: the
// backend's account filter is an `EXISTS` over `tx_queue_accounts`,
// and that is the union of the transactions' account rows.
export function shit_1170_feed_ws_queue_matches_fun(
  queue: SHIT_1170_TX_QUEUE,
  filter: SHIT_1170_FEED_WS_FILTER,
  own_account_id: string | null,
): boolean {
  if (!type_matches_fun(filter.type, false)) return false;
  if (!accounts_match_fun(queue.accounts, filter.accounts)) return false;
  const contracts = queue.transactions.map((one) => one.contractId);
  if (!contracts_match_fun(contracts, filter.contracts)) return false;
  if (
    !hide_sent_matches_fun(queue.accounts, own_account_id, filter.hide_sent)
  ) {
    return false;
  }
  return true;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// does this queued SWAP belong in the reader's feed?
export function shit_1170_feed_ws_swap_matches_fun(
  swap: SHIT_1170_SWAP_QUEUE,
  filter: SHIT_1170_FEED_WS_FILTER,
  own_account_id: string | null,
): boolean {
  if (!type_matches_fun(filter.type, true)) return false;
  if (!accounts_match_fun(swap.accounts, filter.accounts)) return false;
  // --- WHY --- BOTH TOKENS ARE OFFERED: the backend matches a swap
  // when EITHER of its two tokens is a picked contract.
  const contracts = [swap.tokenIn, swap.tokenOut];
  if (!contracts_match_fun(contracts, filter.contracts)) return false;
  if (!hide_sent_matches_fun(swap.accounts, own_account_id, filter.hide_sent)) {
    return false;
  }
  return true;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
