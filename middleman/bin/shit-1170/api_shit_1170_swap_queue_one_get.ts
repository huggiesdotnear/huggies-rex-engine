// ========================================
// API_SHIT_1170_SWAP_QUEUE_ONE_GET
// runnable bin for GET /api/shit-1170/swap-queue/{swap_id} via
// middleman. the middleman logs the framed request + response, so this
// bin only adds a summary.
//
//   bun middleman/bin/shit-1170/api_shit_1170_swap_queue_one_get.ts \
//     --api-key shit_1170_abc123... \
//     --swap-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11
// ========================================

import { api_shit_1170_swap_queue_one_get } from "@huggies/shit-1170-rex-engine-middleman";
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
if (swap_id === undefined) {
  console.error(
    "usage: api_shit_1170_swap_queue_one_get.ts [--base-url <url>] --api-key <key> --swap-id <id>",
  );
  process.exit(1);
}

const swap = await api_shit_1170_swap_queue_one_get(base_url, swap_id, {
  api_key: flags.get("--api-key"),
});

console.log(`SWAP QUEUE ${swap.swapId}: ${swap.tokenIn} -> ${swap.tokenOut}`);
console.log(`  what: ${swap.what ?? "(none)"}`);
console.log(`  when: ${swap.when ?? "(none)"}`);
console.log(`  why:  ${swap.why ?? "(none)"}`);
console.log(`  amount in:  ${swap.amountIn}`);
console.log(`  amount out: ${swap.amountOut ?? "(no quote)"}`);
console.log(`  dex:        ${swap.dexId ?? "(none)"}`);
for (const account of swap.accounts) {
  console.log(
    `    ${account.accountId}  ${account.status}  ${account.txHash ?? "(no hash)"}  ` +
      `out ${account.amountOut ?? "(unknown)"}`,
  );
}
// ========================================
// copyright 2026 by sleet.near
