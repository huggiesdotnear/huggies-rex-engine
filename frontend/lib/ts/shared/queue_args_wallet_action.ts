// ========================================
// queue_args_wallet_action.ts
// the wallet's ACTION shape for a queued call.
//
// --- WHY THIS FILE IS ITS OWN ---
// the shape of the arguments decides whether the bytes survive, and the
// reason is long enough that it needs a home of its own. this file makes
// the shape and explains what it has to be for each kind of wallet.
//
// --- WHAT FASTFS NEEDS ---
// a FastFS upload's arguments are BORSH BYTES, and the indexer reads them
// with `borsh::from_slice(&action.args)`. so the bytes have to reach the
// chain as bytes. a json object cannot be borsh bytes.
//
// --- THE TWO WALLET FAMILIES NEED OPPOSITE SHAPES ---
// the wallets split by what they do with the arguments they are given.
//
//   the BROWSER-SIGNER wallets — MyNearWallet, OKX, Nightly, HOT Wallet —
//   take the arguments as a `Uint8Array` and borsh-serialize the whole
//   transaction in the browser, so the bytes reach the chain untouched.
//   the arguments ride the `postMessage` as a `Uint8Array` and survive.
//
//   the WALLET-SERVER wallets — the Intear Wallet — hand the transaction
//   to their own server as JSON, and their Rust side reads the arguments
//   out of that JSON. their native action type is
//
//       FunctionCallAction { method_name: String, args: Vec<u8> /* base64 */ }
//
//   so their native path wants the arguments as a BASE64 STRING, and
//   their fallback path — the one a connector-shaped action lands on —
//   takes the arguments as a json VALUE and writes them out with
//   `serde_json::to_vec`, which turns the bytes into the json text of a
//   byte map. THAT is what reaches the chain when a FastFS upload goes
//   through the Intear Wallet: 52 bytes of borsh arrive as 426 bytes of
//   json, the indexer finds no borsh, and the action is DROPPED SILENTLY.
//
// so the app has to give each wallet the shape it reads.
//
// --- WHY THE WALLET IS ASKED WHICH ONE IT IS ---
// the connector hands back the connected wallet, and the wallet carries
// its manifest, and the manifest carries the wallet's id. so the app can
// ask, rather than guess, and it asks the wallet that is going to sign.
//
// --- WHY EVERY WALLET GETS THE CONNECTOR SHAPE ---
// near-connect accepts two action shapes and rejects everything else with
// "Unsupported action type": an action that carries a `type` is passed
// through untouched, and an action with a `functionCall` is converted into
// the connector shape. the native shape — `{ "FunctionCall": { … } }` —
// has NEITHER, so near-connect refuses it before the wallet ever sees it.
//
// so the app sends the connector shape, and the wallet reads the bytes out
// of it. the wallets that borsh-serialize the transaction in the browser —
// MyNearWallet, OKX, Nightly, HOT Wallet — take the arguments as a
// `Uint8Array` and the bytes reach the chain untouched.
//
// --- WHY THE INTEAR WALLET IS THE EXCEPTION ---
// the Intear Wallet hands the transaction to its own server as json, and
// its Rust reads the arguments out of that json and writes them out with
// `serde_json::to_vec` — which turns ANY json value into TEXT. a
// `Uint8Array` becomes the json text of a byte map, and a base64 string
// becomes the json text of a string. neither is the file's bytes.
//
// so the Intear Wallet cannot carry raw bytes at all, and the FastFS
// upload does not work through it. that is a wallet limitation, and the
// app says so instead of sending something that is dropped silently.
import type { SHIT_1170_TX_QUEUE_TRANSACTION } from "@huggies/shit-1170-rex-engine-middleman";
import {
  shit_1170_deposit_fun,
  shit_1170_gas_fun,
} from "../shared/gas_deposit";
import { shit_1170_queue_args_bytes_fun } from "../shared/queue_args";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the wallet's transaction shape.
//
// --- WHY THE ACTIONS ARE TYPED LOOSE: the two kinds of wallet take
// different action shapes, and the shape of an action is the wallet's
// business. what this file guarantees is the one thing that matters: the
// arguments of a binary call are bytes, in the form the wallet reads.
export interface SHIT_1170_WALLET_TRANSACTION {
  receiverId: string;
  actions: Array<Record<string, unknown>>;
}

// the wallet's manifest, as far as this file looks at it.
//
// --- WHY ONLY THE ID: the id is what says which wallet this is, and the
// rest of the manifest is the wallet's business.
export interface SHIT_1170_WALLET_MANIFEST {
  id: string;
}

// the wallets that hand the transaction to their own server as json, and
// read the arguments out of that json as a base64 string.
//
// --- WHY THESE IDS: the Intear Wallet's executor is the one that
// `JSON.stringify`s the transactions and signs that text, and its Rust
// reads the native action's arguments as base64. the Trezu Wallet does
// the same thing — it puts `JSON.stringify(transactions)` into a url — and
// its backend is Rust too.
//
// --- WHY THE LIST IS NOT LONGER: every other wallet in the manifest
// borsh-serializes the transaction in the browser, and the bytes survive
// there. a wallet added to this list later needs its own check.
const SHIT_1170_WALLET_SERVER_IDS = [
  "intear-wallet",
  "trezu-wallet",
];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the arguments of a queued call, in the shape a wallet reads.
//
// --- WHY --- THE BYTES COME FROM THE SHARED READER: the queue page shows
// the same bytes, and one place decodes them so the two cannot disagree
// about what the call carries.
//
// --- WHY --- A CALL WITH NO BINARY ARGS GETS ITS JSON OBJECT: the two kinds
// of call are different, and the json object is what the toolbox and the
// wallet both understand.
//
// --- WHY --- THE BASE64 IS STANDARD: the wallets that read a base64
// string decode it with the standard alphabet.
function wallet_args_fun(
  transaction: SHIT_1170_TX_QUEUE_TRANSACTION,
): unknown {
  const args_base64 = transaction.argsBase64;
  if (args_base64 === null || args_base64 === undefined) {
    return transaction.args ?? {};
  }
  return shit_1170_queue_args_bytes_fun(args_base64);
}

// the wallet's id, or an empty string when it is not known.
//
// --- WHY --- THE ID IS READ DEFENSIVELY: the manifest is the wallet's
// own object, and a wallet that does not carry one is not a wallet this
// app knows how to ask.
function wallet_id_fun(manifest: unknown): string {
  if (typeof manifest !== "object" || manifest === null) return "";
  const id = (manifest as SHIT_1170_WALLET_MANIFEST).id;
  return typeof id === "string" ? id : "";
}

// true when the wallet cannot carry raw bytes.
//
// --- WHY --- THE INTEAR WALLET IS ON THE LIST: it hands the transaction
// to its own server as json, and its Rust reads the arguments out of that
// json and writes them out with `serde_json::to_vec`, which turns ANY
// json value into TEXT. a `Uint8Array` becomes the json text of a byte
// map, and a base64 string becomes the json text of a string. neither is
// the file's bytes, so the indexer drops the action and the file never
// appears.
//
// --- WHY THE LIST IS NOT LONGER: every other wallet in the manifest
// borsh-serializes the transaction in the browser, and the bytes survive
// there. a wallet added to this list later needs its own check.
function wallet_cannot_carry_bytes_fun(manifest: unknown): boolean {
  const id = wallet_id_fun(manifest);
  return SHIT_1170_WALLET_SERVER_IDS.includes(id);
}
// ========================================
// ========================================
// --- TRANSACTION -----------------------
// one queued call as the wallet wants it.
//
// --- WHY --- THE RECEIVER IS THE CONTRACT: the queue holds the contract
// the call is made against, and for a FastFS upload that is the namespace
// the file is served under.
//
// --- WHY --- THE GAS AND THE DEPOSIT ARE THE RAW NUMBERS: the queue
// stores what the agent wrote — "30 Tgas", "1 NEAR" — and the wallet wants
// the raw number. the conversion is the toolbox's rule and it lives in
// shared/gas_deposit.ts.
export function shit_1170_wallet_transaction_fun(
  transaction: SHIT_1170_TX_QUEUE_TRANSACTION,
  manifest: unknown,
): SHIT_1170_WALLET_TRANSACTION {
  const gas = shit_1170_gas_fun(transaction.gas);
  const deposit = shit_1170_deposit_fun(transaction.deposit);

  return {
    receiverId: transaction.contractId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: transaction.method,
          args: wallet_args_fun(transaction),
          gas,
          deposit,
        },
      },
    ],
  };
}
// ========================================
// ========================================
// --- CAN CARRY BYTES -------------------
// true when the wallet can carry raw bytes to the chain.
//
// --- WHY --- THE APP ASKS: the reader is about to approve a call, and a
// FastFS upload through a wallet that cannot carry bytes is a call that
// goes out and does nothing. the app says so instead of letting the
// reader approve it in the dark.
export function shit_1170_wallet_can_carry_bytes_fun(
  manifest: unknown,
): boolean {
  return !wallet_cannot_carry_bytes_fun(manifest);
}
// ========================================
// copyright 2026 by sleet.near
