// ========================================
// API_SHIT_1170_TX_QUEUE_POST
// runnable bin for POST /api/shit-1170/tx-queue via middleman. the
// middleman logs the framed request + response, so this bin only adds
// a summary.
//
// a queue_id is a BATCH of transactions. one flag per transaction, in
// the order the flags are given, and that order is the order the
// wallet signs them in:
//
//   bun middleman/bin/shit-1170/api_shit_1170_tx_queue_post.ts \
//     --api-key shit_1170_abc123... \
//     --contract-id ref.finance.near \
//     --method ft_swap \
//     --args '{"receiver_id":"alice.near"}' \
//     --contract-id ref.finance.near \
//     --method ft_resolve_transfer \
//     --args '{"receiver_id":"alice.near"}' \
//     --what "swap 100 USDC for NEAR" \
//     --why "you asked for it" \
//     --account alice.near
//
// --- WHY --- the bin takes --contract-id over and over and not a json
// file: a file is tidier for a batch of five and harder for the common
// case of one. the flag repeats, and the order is the order.
//
// --- WHY --- the argv is scanned RAW and not through split_argv: the
// flags that repeat have to keep their ORDER, and a Map of
// last-write-wins would lose every transaction but the last. so the
// transaction flags are collected here, in the order they appear, and
// the single-valued flags are read with split_argv.
//
// --- WHY --- the flags of one transaction are matched by POSITION and
// not by name: a transaction is one contract, one method, one args, one
// gas and one deposit. the nth --contract-id, the nth --method and the
// nth --args are the nth transaction. that is what lets a caller leave
// --gas or --deposit off one call and on the next.
// ========================================

import {
  api_shit_1170_tx_queue_post,
  type SHIT_1170_TX_QUEUE_TRANSACTION_REQUEST,
} from "@huggies/shit-1170-rex-engine-middleman";
import { resolve_base_url } from "../fun/resolve_base_url";
import { split_argv } from "../fun/split_argv";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied. the default is the local backend,
// which binds 0.0.0.0:54733 (see shit_1170_port_fun.rs).
const DEFAULT_BASE_URL = "http://127.0.0.1:54733";

// the flags that name the pieces of ONE transaction, in the order they
// are collected.
const TRANSACTION_FLAGS = [
  "--contract-id",
  "--method",
  "--args",
  "--gas",
  "--deposit",
] as const;

// the flags that take no value.
const BOOLEAN_FLAGS: string[] = [];

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const argv = process.argv.slice(2);

const { flags } = split_argv(argv, { boolean_flags: BOOLEAN_FLAGS });

// --- WHY --- the base url is resolved from the raw argv rather than
// the split result: split_argv would put --base-url in the flags map,
// and reading the raw argv keeps one rule for the url: it is never a
// positional.
const base_url = resolve_base_url(argv, DEFAULT_BASE_URL);

// --- THE BATCH ---------------------------
// the transactions, in the order the flags were given.
//
// --- WHY --- the scan is over the RAW argv: the order of the repeated
// flags IS the order of the transactions, and split_argv's map is
// last-write-wins. so each occurrence is collected as it is found.
const contract_ids: string[] = [];
const methods: string[] = [];
const args_list: string[] = [];
const gases: string[] = [];
const deposits: string[] = [];

for (let i = 0; i < argv.length; i++) {
  const token = argv[i];
  if (token === undefined) continue;
  // --- WHY --- a repeated flag is read from the raw argv instead of
  // from the map, because the map only holds the LAST value.
  const value = argv[i + 1];
  if (value === undefined || value.startsWith("--")) continue;
  switch (token) {
    case "--contract-id":
      contract_ids.push(value);
      i++;
      break;
    case "--method":
      methods.push(value);
      i++;
      break;
    case "--args":
      args_list.push(value);
      i++;
      break;
    case "--gas":
      gases.push(value);
      i++;
      break;
    case "--deposit":
      deposits.push(value);
      i++;
      break;
    default:
      break;
  }
}

if (contract_ids.length === 0) {
  console.error(
    "usage: api_shit_1170_tx_queue_post.ts [--base-url <url>] --api-key <key> " +
      "--contract-id <id> --method <name> [--args <json>] [--gas <gas>] [--deposit <deposit>] " +
      "[--contract-id <id> --method <name> ...] [--what <text>] [--when <text>] " +
      "[--why <text>] [--when-at <ms>] [--account <account_id> ...]",
  );
  process.exit(1);
}

if (contract_ids.length !== methods.length) {
  console.error(
    `api_shit_1170_tx_queue_post: every transaction needs a --contract-id and a --method ` +
      `(${contract_ids.length} contract id(s), ${methods.length} method(s))`,
  );
  process.exit(1);
}

// the WHO — the accounts this batch is for. each one must be an
// account the api key belongs to.
const accounts: string[] = [];
for (let i = 0; i < argv.length; i++) {
  const token = argv[i];
  if (token === undefined) continue;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith("--")) continue;
  if (token === "--account") {
    accounts.push(value);
    i++;
  }
}

const transactions: SHIT_1170_TX_QUEUE_TRANSACTION_REQUEST[] = [];
for (let i = 0; i < contract_ids.length; i++) {
  const contract_id = contract_ids[i];
  const method = methods[i];
  if (contract_id === undefined || method === undefined) continue;

  // --- WHY --- the args are parsed HERE and not on the backend: the
  // args must be a json OBJECT, and an object is a thing you can check
  // before the round trip. a string that is not json would come back as
  // a 400 with a less useful message than this one.
  const args_raw = args_list[i];
  let args: Record<string, unknown> | undefined;
  if (args_raw !== undefined) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(args_raw);
    } catch {
      console.error(
        `api_shit_1170_tx_queue_post: the --args of transaction ${i} are not json: ${args_raw}`,
      );
      process.exit(1);
    }
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      console.error(
        `api_shit_1170_tx_queue_post: the --args of transaction ${i} must be a json object`,
      );
      process.exit(1);
    }
    args = parsed as Record<string, unknown>;
  }

  const transaction: SHIT_1170_TX_QUEUE_TRANSACTION_REQUEST = {
    contractId: contract_id,
    method,
  };
  if (args !== undefined) transaction.args = args;
  const gas = gases[i];
  if (gas !== undefined) transaction.gas = gas;
  const deposit = deposits[i];
  if (deposit !== undefined) transaction.deposit = deposit;
  transactions.push(transaction);
}

const when_at_raw = flags.get("--when-at");
let when_at: number | undefined;
if (when_at_raw !== undefined) {
  const parsed = Number(when_at_raw);
  if (!Number.isFinite(parsed)) {
    console.error(
      `api_shit_1170_tx_queue_post: --when-at must be a number of milliseconds: ${when_at_raw}`,
    );
    process.exit(1);
  }
  when_at = parsed;
}

const api_key = flags.get("--api-key");

const queue = await api_shit_1170_tx_queue_post(
  base_url,
  {
    what: flags.get("--what"),
    when: flags.get("--when"),
    why: flags.get("--why"),
    whenAt: when_at,
    transactions,
    accounts: accounts.length > 0 ? accounts : undefined,
  },
  { api_key },
);

console.log(
  `TX QUEUE: ${queue.queueId}  ${queue.transactions.length} transaction(s), ` +
    `${queue.accounts.length} account(s)`,
);
for (const transaction of queue.transactions) {
  console.log(
    `  #${transaction.position} ${transaction.contractId}.${transaction.method}` +
      `  tx: ${transaction.txId}`,
  );
}
console.log(
  `  accounts: ${queue.accounts.map((one) => one.accountId).join(", ")}`,
);
// ========================================
// copyright 2026 by sleet.near
