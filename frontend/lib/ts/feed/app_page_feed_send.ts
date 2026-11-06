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
//
// --- WHY THE BINARY ARGS ARE DECODED HERE AND NOT AT THE BACKEND: the
// wallet takes the BYTES. a contract like the FastFS protocol
// (`__fastdata_fastfs`) wants borsh bytes and not json, and the
// browser's wallet adapter passes raw bytes through untouched — it
// tries `JSON.parse` and, when the bytes are not json, hands them on
// as they are. so the base64 the queue holds is turned back into bytes
// here, right before the wallet is asked.
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
import { shit_1170_queue_args_bytes_fun } from "../shared/queue_args";
import { shit_1170_queue_args_wallet_bytes_fun } from "../shared/queue_args_wallet_bytes";
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
//
// --- WHY --- the args are `unknown` and not a json object: a call may
// carry its arguments as raw bytes, and the wallet takes both. the
// adapter tries `JSON.parse` on the bytes and hands them on untouched
// when they are not json.
interface SHIT_1170_WALLET_TRANSACTION {
  receiverId: string;
  actions: Array<{
    type: "FunctionCall";
    params: {
      methodName: string;
      args: unknown;
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
//
// --- WHY THE BINARY ARGS BECOME BYTES: the wallet's adapter reads the
// args as a json object, and a contract that wants raw bytes — the
// FastFS protocol (`__fastdata_fastfs`) is one — cannot be given a json
// object. the adapter takes a `Uint8Array` too, and it tries
// `JSON.parse` on the bytes and passes them through untouched when they
// are not json. so the base64 the queue holds is turned back into the
// bytes the agent wrote.
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
          args: wallet_args_fun(transaction),
          gas: shit_1170_gas_fun(transaction.gas),
          deposit: shit_1170_deposit_fun(transaction.deposit),
        },
      },
    ],
  };
}

// the arguments of a queued call, in the shape the wallet wants.
//
// --- WHY --- THE BYTES COME FROM THE SHARED READER: the queue page
// shows the same bytes, and one place decodes them so the two cannot
// disagree about what the call carries.
//
// --- WHY --- A CALL WITH NO BINARY ARGS GETS ITS JSON OBJECT: the two
// kinds of call are different, and the json object is what the toolbox
// and the wallet both understand.
//
// --- WHY --- THE BYTES GET A `toJSON`: a wallet hands the transaction to
// its signer over a json boundary, and `JSON.stringify` of a `Uint8Array`
// is an OBJECT keyed by the byte indexes. a signer that reads that object
// back as a map of bytes writes out the map's json instead of the file's
// bytes, and the FastFS indexer drops the action silently. the `toJSON`
// makes the args cross that boundary as an ARRAY OF NUMBERS, which is
// what a signer reads as bytes. the reason is written down in
// shared/queue_args_wallet_bytes.ts.
function wallet_args_fun(
  transaction: SHIT_1170_TX_QUEUE_TRANSACTION,
): unknown {
  const args_base64 = transaction.argsBase64;
  if (args_base64 === null || args_base64 === undefined) {
    return transaction.args ?? {};
  }
  return shit_1170_queue_args_wallet_bytes_fun(
    shit_1170_queue_args_bytes_fun(args_base64),
  );
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
