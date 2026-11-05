// ========================================
// API_SHIT_1170_SWAP_QUEUE_GET
// runnable bin for GET /api/shit-1170/swap-queue via middleman. the
// middleman logs the framed request + response, so this bin only adds
// a summary.
//
//   bun middleman/bin/shit-1170/api_shit_1170_swap_queue_get.ts \
//     --api-key shit_1170_abc123... \
//     --limit 50
//
// the filters:
//   --account-id    only the swaps these accounts are on, comma separated
//   --hide-sent     with the account, drop the ones it has already sent
//   --token-in      only the swaps that sell this token
//   --token-out     only the swaps that buy this token
//   --limit         how many to return
//   --cursor        where the page starts, default the first page
//
// --- WHY --- `--hide-sent` NEEDS `--account-id`: "has this account sent
// it" is a question about ONE account, and the backend answers a 400
// for the filter without one.
//
// --- WHY --- --cursor and not --offset: the page is walked by a cursor
// the backend hands out, and the cursor is opaque. there is no offset
// to ask for, and the bin prints the next cursor so the next page can
// be fetched with it.
// ========================================

import { api_shit_1170_swap_queue_get } from "@huggies/shit-1170-rex-engine-middleman";
import { resolve_base_url } from "../fun/resolve_base_url";
import { split_argv } from "../fun/split_argv";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied. the default is the local backend,
// which binds 0.0.0.0:54733 (see shit_1170_port_fun.rs).
const DEFAULT_BASE_URL = "http://127.0.0.1:54733";

// the flags of this bin that take no value.
const BOOLEAN_FLAGS: string[] = ["--hide-sent"];

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const argv = process.argv.slice(2);

const { flags, seen } = split_argv(argv, { boolean_flags: BOOLEAN_FLAGS });

// --- WHY --- the base url is resolved from the raw argv rather than
// the split result: split_argv would put --base-url in the flags map,
// and reading the raw argv keeps one rule for the url: it is never a
// positional.
const base_url = resolve_base_url(argv, DEFAULT_BASE_URL);

const limit_raw = flags.get("--limit");
let limit: number | undefined;
if (limit_raw !== undefined) {
  const parsed = Number(limit_raw);
  if (!Number.isFinite(parsed)) {
    console.error(
      `api_shit_1170_swap_queue_get: --limit must be a number: ${limit_raw}`,
    );
    process.exit(1);
  }
  limit = parsed;
}

const cursor = flags.get("--cursor");

const list = await api_shit_1170_swap_queue_get(
  base_url,
  {
    account_id: flags.get("--account-id"),
    hide_sent: seen.has("--hide-sent"),
    token_in: flags.get("--token-in"),
    token_out: flags.get("--token-out"),
    limit,
    cursor,
  },
  { api_key: flags.get("--api-key") },
);

console.log(`SWAP QUEUE: ${list.items.length} of ${list.total}`);
for (const swap of list.items) {
  console.log(
    `  ${swap.swapId}  ${swap.tokenIn} -> ${swap.tokenOut}  ` +
      `in ${swap.amountIn}  out ${swap.amountOut ?? "(no quote)"}  ` +
      `${swap.accounts.length} account(s)`,
  );
}
console.log(`NEXT CURSOR: ${list.nextCursor ?? "(last page)"}`);
// ========================================
// copyright 2026 by sleet.near
