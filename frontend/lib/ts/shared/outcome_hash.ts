// ========================================
// the transaction hash of a near-kit outcome.
//
// the swap page's swap reports a hash, and the feed's send reports a
// hash per transaction. both read it the same way, so the reading lives
// in one place.
//
// --- WHY --- it is shared and not copied: a near-kit outcome carries
// its hash under `transaction.hash`. copying that knowledge into a
// second file means two copies of one fact, and one of them would
// drift.
import type { SHIT_1170_TX_QUEUE_HASH_REQUEST } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- HASH ------------------------------
// the transaction hash of one outcome, or null.
//
// --- WHY --- the outcome is `unknown` and not a typed near-kit object:
// the wallet hands the outcome back in whatever shape it has, and a
// wallet that answers something else must not crash the page that
// reads it.
export function shit_1170_outcome_hash_fun(outcome: unknown): string | null {
  if (typeof outcome !== "object" || outcome === null) return null;
  const transaction = (outcome as { transaction?: { hash?: unknown } })
    .transaction;
  if (typeof transaction !== "object" || transaction === null) return null;
  const hash = transaction.hash;
  return typeof hash === "string" && hash.length > 0 ? hash : null;
}
// ========================================
// ========================================
// --- FAILED -----------------------------
// did the outcome FAIL.
//
// --- WHY --- the shape is the swap page's: the outcome carries its
// error under `error`, and that is where the reader's failure message
// comes from.
//
// --- WHY --- an outcome with NO error is a success: the chain reports
// a failure with an error, so the absence of one is the success.
export function shit_1170_outcome_failed_fun(outcome: unknown): boolean {
  if (typeof outcome !== "object" || outcome === null) return false;
  const error = (outcome as { error?: unknown }).error;
  return error !== undefined && error !== null;
}
// ========================================
// ========================================
// --- STATUS ----------------------------
// the status a hash entry carries: "succeeded", "failed", or nothing
// at all when the outcome could not be read.
//
// --- WHY --- the status is LEFT OUT when the outcome could not be
// read: the backend records "sent" for an entry with no status, which
// means "it went out and nobody knows how it went yet". a status of
// "succeeded" would be a claim nobody can back.
export function shit_1170_outcome_status_fun(
  outcome: unknown,
): "succeeded" | "failed" | undefined {
  const hash = shit_1170_outcome_hash_fun(outcome);
  if (hash === null) return undefined;
  return shit_1170_outcome_failed_fun(outcome) ? "failed" : "succeeded";
}
// ========================================
// ========================================
// --- REPORT ----------------------------
// the hash entry the backend is told about, or null when the outcome
// carried no hash at all.
//
// --- WHY --- the tx id rides along: the backend knows the order, but
// the wallet answers in the order it sent, and a reader wants the hash
// on the right transaction. the tx id makes the match explicit.
export function shit_1170_outcome_report_fun(
  tx_id: string,
  outcome: unknown,
): SHIT_1170_TX_QUEUE_HASH_REQUEST | null {
  const tx_hash = shit_1170_outcome_hash_fun(outcome);
  if (tx_hash === null) return null;
  const status = shit_1170_outcome_status_fun(outcome);
  if (status === undefined) return { txId: tx_id, txHash: tx_hash };
  return { txId: tx_id, txHash: tx_hash, status };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
