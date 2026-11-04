// ========================================
// API_SHIT_1170_SWAP_QUEUE_SENT_POST
// runnable bin for POST /api/shit-1170/swap-queue/{swap_id}/sent via
// middleman. the middleman logs the framed request + response, so this
// bin only adds a summary.
//
// THIS is the route the swap page calls after it executes a queued swap,
// so the swap's status moves from `pending` to `sent` to `succeeded` or
// `failed`.
//
//   bun middleman/bin/shit-1170/api_shit_1170_swap_queue_sent_post.ts \
//     --api-key shit_1170_abc123... \
//     --swap-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
//     --tx-hash 9t6w... \
//     --status succeeded \
//     --amount-out 4999000000000000000000000
//
// --- WHY --- the status is OPTIONAL: without it the status is `sent`,
// which means "it went out and nobody knows how it went yet".
// ========================================

import { api_shit_1170_swap_queue_sent_post } from "@huggies/shit-1170-rex-engine-middleman";
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

const swap_id = flags.get("--swap-id");
const tx_hash = flags.get("--tx-hash");
if (swap_id === undefined || tx_hash === undefined) {
  console.error(
    "usage: api_shit_1170_swap_queue_sent_post.ts [--base-url <url>] " +
      "--api-key <key> --swap-id <id> --tx-hash <hash> " +
      "[--status succeeded|failed] [--amount-out <raw>]",
  );
  process.exit(1);
}

// --- WHY --- the status is CHECKED here: the backend refuses anything
// but `succeeded` and `failed`, and a 400 says less than naming the
// word that is wrong.
const status = flags.get("--status");
if (status !== undefined && status !== "succeeded" && status !== "failed") {
  console.error(
    `api_shit_1170_swap_queue_sent_post: --status must be succeeded or failed, not ${status}`,
  );
  process.exit(1);
}

const swap = await api_shit_1170_swap_queue_sent_post(
  base_url,
  swap_id,
  {
    txHash: tx_hash,
    status,
    amountOut: flags.get("--amount-out"),
  },
  { api_key: flags.get("--api-key") },
);

console.log(`SWAP QUEUE ${swap.swapId}: ${swap.accounts.length} account(s)`);
for (const account of swap.accounts) {
  console.log(
    `    ${account.accountId}  ${account.status}  ${account.txHash ?? "(no hash)"}  ` +
      `out ${account.amountOut ?? "(unknown)"}`,
  );
}
// ========================================
// copyright 2026 by sleet.near
