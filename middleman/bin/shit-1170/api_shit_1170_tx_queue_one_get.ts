// ========================================
// API_SHIT_1170_TX_QUEUE_ONE_GET
// runnable bin for GET /api/shit-1170/tx-queue/{queue_id} via
// middleman. the middleman logs the framed request + response, so this
// bin only adds a summary.
//
//   bun middleman/bin/shit-1170/api_shit_1170_tx_queue_one_get.ts \
//     --api-key shit_1170_abc123... \
//     --queue-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11
// ========================================

import { api_shit_1170_tx_queue_one_get } from "@huggies/shit-1170-rex-engine-middleman";
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

const queue_id = flags.get("--queue-id");
if (queue_id === undefined) {
  console.error(
    "usage: api_shit_1170_tx_queue_one_get.ts [--base-url <url>] --api-key <key> --queue-id <id>",
  );
  process.exit(1);
}

const queue = await api_shit_1170_tx_queue_one_get(base_url, queue_id, {
  api_key: flags.get("--api-key"),
});

console.log(
  `TX QUEUE ${queue.queueId}: ${queue.transactions.length} transaction(s), ` +
    `${queue.accounts.length} account(s)`,
);
console.log(`  what: ${queue.what ?? "(none)"}`);
console.log(`  when: ${queue.when ?? "(none)"}`);
console.log(`  why:  ${queue.why ?? "(none)"}`);
for (const transaction of queue.transactions) {
  console.log(
    `  #${transaction.position} ${transaction.contractId}.${transaction.method}` +
      `  tx: ${transaction.txId}`,
  );
  console.log(`    args: ${JSON.stringify(transaction.args)}`);
  for (const account of transaction.accounts) {
    console.log(
      `    ${account.accountId}  ${account.status}  ${account.txHash ?? "(no hash)"}`,
    );
  }
}
// ========================================
// copyright 2026 by sleet.near
