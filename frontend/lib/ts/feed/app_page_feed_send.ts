// ========================================
// send a queued batch: the wallet popup, the outcomes, the report to the
// backend and the toast.
//
// --- WHY THE WALLET IS CALLED DIRECTLY AND NOT THROUGH THE TOOLBOX'S
// HELPER: `generic_contract_call_wallet` returns only the hashes and
// throws the outcome away. the outcome is the thing the queue records —
// "succeeded" or "failed" — so the app asks the wallet for the
// outcomes itself and reads both.
//
// --- WHY ONE POPUP FOR THE WHOLE BATCH: the batch is one offer of
// work. a reader who signs it signs all of it, and the wallet is
// asked for the whole list at once.
//
// --- WHY THE ACCOUNT COMES FROM THE API KEY: the request carries the
// reader's key and the backend knows the account. the body does not
// repeat it, because a body that named the account could name somebody
// else's.
import { near_connect_client } from "@near-kit-tool-box/web";
import {
  api_shit_1170_tx_queue_sent_post,
  type SHIT_1170_TX_QUEUE,
  type SHIT_1170_TX_QUEUE_TRANSACTION,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
import { api_key_options_fun } from "../shared/api_key_token";
import {
  shit_1170_deposit_fun,
  shit_1170_gas_fun,
} from "../shared/gas_deposit";
import { shit_1170_outcome_hash_fun } from "../shared/outcome_hash";
import { SHIT_1170_TOAST_STORE } from "../shared/toast_store";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what came of the send.
export interface SHIT_1170_QUEUE_SEND_RESULT {
  // true when the batch went out.
  sent: boolean;
  // how many of the transactions worked.
  succeeded: number;
  // how many of the transactions failed.
  failed: number;
  // the hash of the first transaction that was sent, for the link to
  // the transaction page. null when nothing went out.
  tx_hash: string | null;
  // the message for the reader, when something failed.
  error: string | null;
  // true when the reader DECLINED the wallet popup.
  //
  // --- WHY --- a decline is its own thing: the reader said no. that
  // is not a failure, and a toast that said "it failed" would be
  // telling the reader they did something wrong.
  declined: boolean;
}

// the wallet's transaction shape.
interface SHIT_1170_WALLET_TRANSACTION {
  receiverId: string;
  actions: Array<{
    type: "FunctionCall";
    params: {
      methodName: string;
      args: Record<string, unknown>;
      gas: string;
      deposit: string;
    };
  }>;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// one queued call in the shape the wallet wants.
//
// --- WHY THE GAS AND THE DEPOSIT ARE CONVERTED HERE: the queue stores
// what the agent wrote — "30 Tgas", "1 NEAR" — and the wallet wants
// the raw numbers. the conversion is the toolbox's rule, carried in
// shared/gas_deposit.ts.
function to_wallet_transaction_fun(
  transaction: SHIT_1170_TX_QUEUE_TRANSACTION,
): SHIT_1170_WALLET_TRANSACTION {
  return {
    receiverId: transaction.contractId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: transaction.method,
          args: transaction.args ?? {},
          gas: shit_1170_gas_fun(transaction.gas),
          deposit: shit_1170_deposit_fun(transaction.deposit),
        },
      },
    ],
  };
}
// ========================================
// --- DECLINED --------------------------
// did the reader decline the wallet popup.
//
// --- WHY --- the wallet's decline message is matched loosely: every
// wallet says it in its own words, and the app only needs to know that
// the reader said no rather than that the send broke.
function is_declined_fun(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const message = (err as { message?: unknown }).message;
  if (typeof message !== "string") return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("declined") ||
    lower.includes("denied") ||
    lower.includes("rejected") ||
    lower.includes("cancelled") ||
    lower.includes("canceled")
  );
}
// ========================================
// ========================================
// --- SEND ------------------------------
// send the batch and report what came of it.
export async function shit_1170_queue_send_fun(
  queue: SHIT_1170_TX_QUEUE,
  account_id: string,
): Promise<SHIT_1170_QUEUE_SEND_RESULT> {
  const transactions = queue.transactions;
  if (transactions.length === 0) {
    return {
      sent: false,
      succeeded: 0,
      failed: 0,
      tx_hash: null,
      error: "THIS BATCH HAS NO CALLS TO SEND",
      declined: false,
    };
  }

  let outcomes: ReadonlyArray<unknown>;
  try {
    const connector = near_connect_client();
    const wallet = await connector.wallet();
    outcomes = await wallet.signAndSendTransactions({
      signerId: account_id,
      transactions: transactions.map(to_wallet_transaction_fun),
    });
  } catch (err) {
    // --- WHY --- A DECLINE IS NOT AN ERROR: the reader said no, and
    // that is not a failure. it is reported as a decline and the reader
    // is not toasted.
    if (is_declined_fun(err)) {
      return {
        sent: false,
        succeeded: 0,
        failed: 0,
        tx_hash: null,
        error: null,
        declined: true,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    SHIT_1170_TOAST_STORE.show("error", "SEND FAILED", message, null);
    return {
      sent: false,
      succeeded: 0,
      failed: 0,
      tx_hash: null,
      error: message,
      declined: false,
    };
  }

  // --- WHY --- THE OUTCOMES ARE MATCHED BY POSITION AND NOT BY ORDER:
  // the wallet answers in the order it sent, and the queue's own
  // `position` is the truth about which call is which.
  const tx_hashes: Array<{
    txId: string;
    txHash: string;
    status?: "succeeded" | "failed";
  }> = [];
  let succeeded = 0;
  let failed = 0;
  let first_hash: string | null = null;
  for (const transaction of transactions) {
    const outcome = outcomes[transaction.position];
    if (outcome === undefined) continue;
    const hash = shit_1170_outcome_hash_fun(outcome);
    if (hash === null) continue;
    if (first_hash === null) first_hash = hash;
    // --- WHY --- THE STATUS IS READ AND NOT GUESSED: the outcome
    // carries its error when the call failed. a status the app cannot
    // back is not sent, and the backend records "sent" — it went out
    // and nobody knows how it went yet.
    const error = (outcome as { error?: unknown }).error;
    if (error !== undefined && error !== null) {
      failed += 1;
      tx_hashes.push({
        txId: transaction.txId,
        txHash: hash,
        status: "failed",
      });
      continue;
    }
    succeeded += 1;
    tx_hashes.push({
      txId: transaction.txId,
      txHash: hash,
      status: "succeeded",
    });
  }

  if (tx_hashes.length === 0) {
    const message = "THE WALLET SENT NOTHING";
    SHIT_1170_TOAST_STORE.show("error", "SEND FAILED", message, null);
    return {
      sent: false,
      succeeded: 0,
      failed: 0,
      tx_hash: null,
      error: message,
      declined: false,
    };
  }

  // --- WHY --- THE BACKEND IS TOLD IN ONE CALL: the wallet sent the
  // whole batch in one popup, so the app learned everything about the
  // whole batch at once. one call reports it all.
  try {
    const options = await api_key_options_fun(true, account_id);
    await api_shit_1170_tx_queue_sent_post(
      SHIT_1170_BASE_URL,
      queue.queueId,
      { txHashes: tx_hashes },
      options,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // --- WHY --- THE SEND IS STILL A SEND: the transactions went out
    // whatever the backend says about them. the toast says so and the
    // hash is still linked, so the reader can look at the chain.
    SHIT_1170_TOAST_STORE.show(
      "info",
      "SENT — NOT RECORDED",
      message,
      first_hash,
    );
    return {
      sent: true,
      succeeded,
      failed,
      tx_hash: first_hash,
      error: message,
      declined: false,
    };
  }

  // --- WHY --- THE TOAST SAYS HOW MANY WORKED WHEN NOT ALL OF THEM
  // DID: "SENT" alone would say the whole batch worked, and a reader
  // who had two failures out of three would not know.
  if (failed > 0) {
    SHIT_1170_TOAST_STORE.show(
      "info",
      "SENT",
      `${succeeded} of ${transactions.length} transactions worked`,
      first_hash,
    );
  } else {
    SHIT_1170_TOAST_STORE.show("success", "SENT", null, first_hash);
  }

  return {
    sent: true,
    succeeded,
    failed,
    tx_hash: first_hash,
    error: null,
    declined: false,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
