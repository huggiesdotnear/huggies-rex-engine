// ========================================
// the wallet's action shape for a queued call, tested.
//
// this is the file that decides whether a FastFS upload works. the
// indexer reads the action's args with `borsh::from_slice`, so the
// bytes have to reach the chain as bytes.
//
// --- THE TWO ROUTES ---
// a call with json arguments goes out as the CONNECTOR shape, through
// the wallet's own method:
//
//   { type: "FunctionCall", params: { methodName, args, gas, deposit } }
//
// a call with raw bytes goes out as the NATIVE shape, through the
// wallet's `executor`:
//
//   { FunctionCall: { method_name, args, gas, deposit } }
//
// the native route is the only one that carries bytes, and the reason
// is written down in shared/queue_args_wallet_action.ts.
//
// run it with:
//   bun test frontend/lib/ts/shared/queue_args_wallet_action.test.ts
// ========================================

import { describe, expect, test } from "bun:test";

import {
  shit_1170_batch_has_bytes_fun,
  shit_1170_transaction_has_bytes_fun,
  shit_1170_wallet_can_carry_bytes_fun,
  shit_1170_wallet_executor_fun,
  shit_1170_wallet_native_transaction_fun,
  shit_1170_wallet_transaction_fun,
} from "./queue_args_wallet_action";
// ========================================
// --- THE FIXTURES ----------------------
// a queued call with json arguments.
const JSON_CALL = {
  txId: "tx-1",
  position: 0,
  contractId: "usdt.tether-token.near",
  method: "ft_transfer",
  args: { receiver_id: "bob.near", amount: "25000000" },
  argsBase64: null,
  gas: "30000000000000",
  deposit: "1",
  accounts: [],
};

// a queued call with raw bytes — a FastFS upload.
//
// the base64 here is the borsh of a `Simple` payload whose path is
// "test.txt", whose mime is "text/plain" and whose content is "hi".
// its first byte is 0x00, which is the borsh enum's variant byte.
const BYTES_CALL = {
  txId: "tx-2",
  position: 0,
  contractId: "fastfs.near",
  method: "__fastdata_fastfs",
  args: {},
  argsBase64:
    "AAYAAABmdC50eHQBCgAAAHRleHQvcGxhaW4LAAAAaGVsbG8gd29ybGQ=",
  gas: "1",
  deposit: "0",
  accounts: [],
};
// ========================================
// --- THE TESTS -------------------------
describe("the wallet's action shape", () => {
  test("a call with json arguments keeps the connector shape", () => {
    const transaction = shit_1170_wallet_transaction_fun(JSON_CALL);

    expect(transaction.receiverId).toBe("usdt.tether-token.near");
    expect(transaction.actions).toHaveLength(1);

    const action = transaction.actions[0]!;
    expect(action.type).toBe("FunctionCall");
    const params = action.params as Record<string, unknown>;
    expect(params.methodName).toBe("ft_transfer");
    expect(params.args).toEqual({ receiver_id: "bob.near", amount: "25000000" });
    expect(params.gas).toBe("30000000000000");
    expect(params.deposit).toBe("1");
  });

  test("a call with bytes goes out as the native shape", () => {
    const transaction = shit_1170_wallet_native_transaction_fun(BYTES_CALL);

    expect(transaction.receiverId).toBe("fastfs.near");
    expect(transaction.actions).toHaveLength(1);

    const action = transaction.actions[0]!;

    // --- THE NATIVE SHAPE ---
    // PascalCase variant, snake_case fields. NOT { type, params }.
    expect(action.FunctionCall).toBeDefined();
    const call = action.FunctionCall as Record<string, unknown>;
    expect(call.method_name).toBe("__fastdata_fastfs");
    expect(call.gas).toBe("1");
    expect(call.deposit).toBe("0");

    // --- NO top-level "type" key ---
    // the wallet's native variant is an EXTERNALLY TAGGED enum, so a
    // sibling "type" key makes serde look for a variant named "type" and
    // fail with `unknown variant 'type', expected 'FunctionCall'`.
    expect(action.type).toBeUndefined();

    // --- THE ARGS ARE BASE64 ---
    // the native action holds its arguments as `Vec<u8>` with
    // `#[serde_as(as = "Base64")]`, so the base64 string is decoded into
    // the exact bytes and those go on chain verbatim.
    expect(typeof call.args).toBe("string");
    expect(call.args).toBe(BYTES_CALL.argsBase64);

    // and the bytes it decodes to are borsh — the first byte is the
    // enum's variant byte, NOT a quote. a quote is what a json-stringified
    // byte array looks like, and the indexer drops that action silently.
    const decoded = Uint8Array.from(atob(call.args as string), (character) =>
      character.charCodeAt(0),
    );
    expect(decoded[0]).toBe(0x00);
    expect(decoded[0]).not.toBe(0x22);
  });

  test("the payload says which kind of call it is", () => {
    expect(shit_1170_transaction_has_bytes_fun(JSON_CALL)).toBe(false);
    expect(shit_1170_transaction_has_bytes_fun(BYTES_CALL)).toBe(true);

    expect(shit_1170_batch_has_bytes_fun([JSON_CALL])).toBe(false);
    expect(shit_1170_batch_has_bytes_fun([JSON_CALL, BYTES_CALL])).toBe(true);
  });
});

describe("the wallet that can carry bytes", () => {
  test("the intear wallet can carry bytes", () => {
    expect(
      shit_1170_wallet_can_carry_bytes_fun({ id: "intear-wallet" }),
    ).toBe(true);
  });

  test("the other wallets cannot, and the app says so", () => {
    for (const id of [
      "mynearwallet",
      "okx-wallet",
      "nightly-wallet",
      "hot-wallet",
      "trezu-wallet",
      "ledger",
    ]) {
      expect(shit_1170_wallet_can_carry_bytes_fun({ id })).toBe(false);
    }
  });

  test("a wallet with no manifest is not a wallet this app knows", () => {
    expect(shit_1170_wallet_can_carry_bytes_fun(undefined)).toBe(false);
    expect(shit_1170_wallet_can_carry_bytes_fun(null)).toBe(false);
    expect(shit_1170_wallet_can_carry_bytes_fun({})).toBe(false);
    expect(shit_1170_wallet_can_carry_bytes_fun({ id: 42 })).toBe(false);
  });
});

describe("the wallet's executor", () => {
  test("it is found when the wallet has one", async () => {
    const call = async () => "sent";
    const executor = shit_1170_wallet_executor_fun({ executor: { call } });
    expect(executor).not.toBeNull();
    expect(await executor!.call("wallet:signAndSendTransactions", {})).toBe(
      "sent",
    );
  });

  test("it is not found when the wallet has none", () => {
    expect(shit_1170_wallet_executor_fun({})).toBeNull();
    expect(shit_1170_wallet_executor_fun({ executor: {} })).toBeNull();
    expect(shit_1170_wallet_executor_fun({ executor: { call: "no" } })).toBeNull();
    expect(shit_1170_wallet_executor_fun(undefined)).toBeNull();
    expect(shit_1170_wallet_executor_fun(null)).toBeNull();
  });
});

describe("the params the wallet reads", () => {
  // --- WHY THIS IS PINNED ---
  // the wallet's own connector reads the params like this:
  //
  //   async signAndSendTransactions({ network, transactions }) {
  //     transactions = transactions.map(t => ({
  //       signerId: t.signerId ?? this.near.connectedAccount.accountId,
  //       receiverId: t.receiverId,
  //       actions: t.actions,
  //     }));
  //     ...
  //   }
  //
  // the `actions` are passed through UNTOUCHED — only `action.params.code`
  // is rewritten, and a native action has no `params`. so the native shape
  // reaches the wallet's Rust exactly as it was built.
  //
  // and the SIGNER is read per transaction, with the wallet's own account
  // as the fallback. so the app's selected account has to be on EACH
  // transaction — a top-level `signerId` alone would sign with the
  // wallet's default account, which may be a different one.

  test("a transaction carries the signer, the receiver and the actions", () => {
    const transaction = {
      ...shit_1170_wallet_native_transaction_fun(BYTES_CALL),
      signerId: "sleet.near",
    };

    expect(transaction.signerId).toBe("sleet.near");
    expect(transaction.receiverId).toBe("fastfs.near");
    expect(transaction.actions).toHaveLength(1);

    // the native action is NOT rewritten — no `params` key for the
    // wallet's `fixAction` to touch.
    const action = transaction.actions[0]!;
    expect(action.params).toBeUndefined();
    expect(action.FunctionCall).toBeDefined();
  });
});
// ========================================
// copyright 2026 by sleet.near
