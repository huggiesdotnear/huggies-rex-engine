// ========================================
// API_SHIT_1170_TX_QUEUE_SENT_POST
// runnable bin for POST /api/shit-1170/tx-queue/{queue_id}/sent via
// middleman. the middleman logs the framed request + response, so this
// bin only adds a summary.
//
// ONE call for the whole batch — the wallet sent every transaction in
// one popup, so the app reports every hash in one call. the flags
// repeat, and the nth --tx-id, the nth --tx-hash and the nth --status
// are the nth entry:
//
//   bun middleman/bin/shit-1170/api_shit_1170_tx_queue_sent_post.ts \
//     --api-key shit_1170_abc123... \
//     --queue-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
//     --tx-id 1a2b3c4d-0000-0000-0000-000000000001 \
//     --tx-hash 9hN3lq... \
//     --status succeeded \
//     --tx-id 1a2b3c4d-0000-0000-0000-000000000002 \
//     --tx-hash AbCdEf... \
//     --status failed
//
// --status is OPTIONAL: without it the status is `sent`, which means
// "it went out and nobody knows how it went yet".
//
// --- WHY --- the argv is scanned RAW and not through split_argv: the
// flags that repeat have to keep their ORDER, and a Map of
// last-write-wins would lose every entry but the last.
//
// --- WHY --- the flags of one entry are matched by POSITION and not by
// name: an entry is one tx id, one hash and one status. the nth of
// each is the nth entry.
// ========================================

import {
  api_shit_1170_tx_queue_sent_post,
  type SHIT_1170_TX_QUEUE_HASH_REQUEST,
  type SHIT_1170_TX_QUEUE_STATUS,
} from "@huggies/shit-1170-rex-engine-middleman";
import { resolve_base_url } from "../fun/resolve_base_url";
import { split_argv } from "../fun/split_argv";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied. the default is the local backend,
// which binds 0.0.0.0:54733 (see shit_1170_port_fun.rs).
const DEFAULT_BASE_URL = "http://127.0.0.1:54733";

// the flags of this bin that take no value.
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

// --- THE HASHES -------------------------
const tx_ids: string[] = [];
const tx_hashes: string[] = [];
const statuses: string[] = [];

for (let i = 0; i < argv.length; i++) {
  const token = argv[i];
  if (token === undefined) continue;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith("--")) continue;
  switch (token) {
    case "--tx-id":
      tx_ids.push(value);
      i++;
      break;
    case "--tx-hash":
      tx_hashes.push(value);
      i++;
      break;
    case "--status":
      statuses.push(value);
      i++;
      break;
    default:
      break;
  }
}

if (tx_ids.length === 0) {
  console.error(
    "usage: api_shit_1170_tx_queue_sent_post.ts [--base-url <url>] --api-key <key> " +
      "--queue-id <id> --tx-id <id> --tx-hash <hash> [--status <status>] " +
      "[--tx-id <id> --tx-hash <hash> ...]",
  );
  process.exit(1);
}

if (tx_ids.length !== tx_hashes.length) {
  console.error(
    `api_shit_1170_tx_queue_sent_post: every entry needs a --tx-id and a --tx-hash ` +
      `(${tx_ids.length} tx id(s), ${tx_hashes.length} hash(es))`,
  );
  process.exit(1);
}

// --- WHY --- the status is checked HERE and not only on the server:
// the backend only takes `succeeded` and `failed`, and a typo would
// come back as a 400 with a less useful message than this one.
const ALLOWED_STATUSES: SHIT_1170_TX_QUEUE_STATUS[] = [
  "sent",
  "succeeded",
  "failed",
];

const txHashes: SHIT_1170_TX_QUEUE_HASH_REQUEST[] = [];
for (let i = 0; i < tx_ids.length; i++) {
  const tx_id = tx_ids[i];
  const tx_hash = tx_hashes[i];
  if (tx_id === undefined || tx_hash === undefined) continue;

  const entry: SHIT_1170_TX_QUEUE_HASH_REQUEST = {
    txId: tx_id,
    txHash: tx_hash,
  };

  const status = statuses[i];
  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status as SHIT_1170_TX_QUEUE_STATUS)) {
      console.error(
        `api_shit_1170_tx_queue_sent_post: the --status of entry ${i} must be one of ` +
          `${ALLOWED_STATUSES.join(", ")}: ${status}`,
      );
      process.exit(1);
    }
    entry.status = status as SHIT_1170_TX_QUEUE_STATUS;
  }

  txHashes.push(entry);
}

const queue_id = flags.get("--queue-id");
if (queue_id === undefined) {
  console.error(
    "usage: api_shit_1170_tx_queue_sent_post.ts [--base-url <url>] --api-key <key> " +
      "--queue-id <id> --tx-id <id> --tx-hash <hash> [--status <status>]",
  );
  process.exit(1);
}

const queue = await api_shit_1170_tx_queue_sent_post(
  base_url,
  queue_id,
  { txHashes },
  { api_key: flags.get("--api-key") },
);

console.log(
  `TX QUEUE ${queue.queueId}: ${queue.transactions.length} transaction(s), ` +
    `${queue.accounts.length} account(s)`,
);
for (const transaction of queue.transactions) {
  console.log(
    `  #${transaction.position} ${transaction.contractId}.${transaction.method}`,
  );
  for (const account of transaction.accounts) {
    console.log(
      `    ${account.accountId}  ${account.status}  ${account.txHash ?? "(no hash)"}`,
    );
  }
}
// ========================================
// copyright 2026 by sleet.near
