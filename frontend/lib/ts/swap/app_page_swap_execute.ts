// ========================================
// send a swap.
//
// this is the app's FIRST transaction, so the shape of it matters: the
// route's transactions are handed to the wallet in ONE popup, the
// aggregator is asked what actually happened, and only then are the
// fee legs sent.
//
// --- WHY EXECUTE_ROUTE_FULL_BATCHED AND NOT A PLAIN LOOP: the
// transaction carrying an `ft_transfer_call` swap SUCCEEDS even when
// the dex refunds it — a refund shows up as `SuccessValue: "IjAi"`,
// which a status check reads as success. so a swap can move zero
// tokens and still look perfect. the aggregator's outcome check is the
// only thing that sees the refund, and it is what decides whether the
// referral fee legs are owed. sending every leg on sight pays fees on
// swaps that never happened.
//
// --- WHY THE BATCHED VARIANT: `wallet.signAndSendTransactions`
// (plural) hands the wallet every transaction at once, so a multi-leg
// swap is ONE popup instead of one per leg.
import {
  DEX_AGGREGATOR_CLIENT_ERROR,
  EXECUTE_ROUTE_FULL_BATCHED,
  FORMAT_DEX_AGGREGATOR_ERROR,
  type ROUTE,
} from "@sleet-js/intear-dex-aggregator-tool-box";
import { near_connect_client } from "@near-kit-tool-box/web";
import { HUGGIES_SWAP_AGGREGATOR } from "./app_page_swap_aggregator";
import { router_token_id_fun } from "./app_page_swap_router_token";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what happened to the swap.
export interface HUGGIES_SWAP_EXECUTION {
  // true when the swap went through.
  succeeded: boolean;
  // the transaction hash of the first swap transaction, for the link
  // to the transaction page. null when nothing was sent.
  tx_hash: string | null;
  // the amount that came out, in the output token's smallest unit.
  amount_out: string | null;
  // the message for the reader, when it failed.
  error: string | null;
  // true when the swap may well have gone through but we could not
  // tell — the outcome CHECK failed, not the swap.
  unknown: boolean;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the transaction hash of one outcome, or null.
//
// --- WHY --- the outcomes are near-kit's FinalExecutionOutcome, whose
// hash lives under `transaction.hash`.
function outcome_hash_fun(outcome: unknown): string | null {
  if (typeof outcome !== "object" || outcome === null) return null;
  const transaction = (outcome as { transaction?: { hash?: unknown } })
    .transaction;
  if (typeof transaction !== "object" || transaction === null) return null;
  const hash = transaction.hash;
  return typeof hash === "string" && hash.length > 0 ? hash : null;
}
// ========================================
// the hash of the first transaction that was actually sent.
function first_hash_fun(outcomes: ReadonlyArray<unknown>): string | null {
  for (const outcome of outcomes) {
    const hash = outcome_hash_fun(outcome);
    if (hash !== null) return hash;
  }
  return null;
}
// ========================================
// ========================================
// --- EXECUTE ---------------------------
// send the route and report what happened.
//
// --- WHY --- `on_failure: "recover"`: a failed swap can strand the
// reader's tokens — a NEAR swap that fails after the wNEAR deposit
// leaves the wNEAR sitting there. the aggregator's recovery steps
// return it, so the reader is left where they started instead of with
// tokens stuck in a wrapper.
async function execute_swap_fun(
  route: ROUTE,
  token_in: string,
  token_out: string,
  signer_id: string,
): Promise<HUGGIES_SWAP_EXECUTION> {
  try {
    const connector = near_connect_client();
    const wallet = await connector.wallet();
    const result = await EXECUTE_ROUTE_FULL_BATCHED(wallet, route, {
      client: HUGGIES_SWAP_AGGREGATOR.client,
      signer_id,
      token_in: router_token_id_fun(token_in),
      token_out: router_token_id_fun(token_out),
      on_failure: "recover",
      fee_amount: route.fee_amount ?? "0",
    });
    return {
      succeeded: result.swap_succeeded,
      tx_hash: first_hash_fun(result.swap_outcomes),
      amount_out: result.final_outcome.amount_out ?? null,
      error: result.swap_succeeded
        ? null
        : (result.outcome.error ?? "THE SWAP FAILED"),
      unknown: false,
    };
  } catch (err) {
    // --- WHY --- the two failure kinds are kept apart: a swap that
    // failed is one thing, and a CHECK that could not complete is
    // another — the swap may well have gone through. reporting the
    // second as a failure is how a working swap gets called broken.
    if (err instanceof DEX_AGGREGATOR_CLIENT_ERROR) {
      if (err.error.kind === "swap_failed") {
        return {
          succeeded: false,
          tx_hash: null,
          amount_out: null,
          error: err.error.message,
          unknown: false,
        };
      }
      if (err.error.kind === "outcome_unavailable") {
        return {
          succeeded: false,
          tx_hash: null,
          amount_out: null,
          error: err.error.message,
          unknown: true,
        };
      }
      // --- WHY --- the formatter and not `err.error.message`: the
      // error union is not uniform. `route_not_found` carries a `hint`
      // and no `message`, so reading `.message` off it is undefined.
      // the package's formatter knows every variant.
      return {
        succeeded: false,
        tx_hash: null,
        amount_out: null,
        error: FORMAT_DEX_AGGREGATOR_ERROR(err.error),
        unknown: false,
      };
    }
    return {
      succeeded: false,
      tx_hash: null,
      amount_out: null,
      error: err instanceof Error ? err.message : String(err),
      unknown: false,
    };
  }
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_SWAP_EXECUTE = {
  execute: execute_swap_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
