// ========================================
// API_SHIT_1170_TX_QUEUE_ACCOUNTS_DELETE
// runnable bin for DELETE /api/shit-1170/tx-queue/{queue_id}/accounts/
// {account_id} via middleman. the middleman logs the framed request +
// response, so this bin only adds a summary.
//
//   bun middleman/bin/shit-1170/api_shit_1170_tx_queue_accounts_delete.ts \
//     --api-key shit_1170_abc123... \
//     --queue-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
//     --account-id alice.near
//
// --- WHY --- the account id is a flag and not a positional: the
// account has to be the one the api key belongs to, and naming it
// next to the key says so.
//
// --- WHY --- the request carries NO BODY: the account to remove is in
// the path, and the api key in the header says who is asking.
// ========================================

import { api_shit_1170_tx_queue_accounts_delete } from "@huggies/shit-1170-rex-engine-middleman";
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
const account_id = flags.get("--account-id");
if (queue_id === undefined || account_id === undefined) {
  console.error(
    "usage: api_shit_1170_tx_queue_accounts_delete.ts [--base-url <url>] " +
      "--api-key <key> --queue-id <id> --account-id <account_id>",
  );
  process.exit(1);
}

const queue = await api_shit_1170_tx_queue_accounts_delete(
  base_url,
  queue_id,
  account_id,
  { api_key: flags.get("--api-key") },
);

console.log(
  `TX QUEUE ${queue.queueId}: ${queue.transactions.length} transaction(s), ` +
    `${queue.accounts.length} account(s)`,
);
for (const account of queue.accounts) {
  console.log(`  ${account.accountId}  ${account.status}`);
}
// ========================================
// copyright 2026 by sleet.near
