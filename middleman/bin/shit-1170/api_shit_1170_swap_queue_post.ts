// ========================================
// API_SHIT_1170_SWAP_QUEUE_POST
// runnable bin for POST /api/shit-1170/swap-queue via middleman. the
// middleman logs the framed request + response, so this bin only adds
// a summary.
//
// a queued swap is NOT a queued batch of transactions: the agent does
// not know the route. it names the token in, the amount in and the token
// out, and the route is worked out when the swap is executed.
//
//   bun middleman/bin/shit-1170/api_shit_1170_swap_queue_post.ts \
//     --api-key shit_1170_abc123... \
//     --token-in usdt.tether-token.near \
//     --amount-in 100000000 \
//     --token-out near \
//     --what "swap 100 USDC for NEAR" \
//     --why "you asked for it" \
//     --account alice.near
//
// --- WHY --- the amount in is the RAW unit amount and not a human
// amount: the chain and the router trade the token's smallest unit, and
// a human amount only means something next to the token it belongs to.
// ========================================

import { api_shit_1170_swap_queue_post } from "@huggies/shit-1170-rex-engine-middleman";
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

const token_in = flags.get("--token-in");
const amount_in = flags.get("--amount-in");
const token_out = flags.get("--token-out");
if (
  token_in === undefined ||
  amount_in === undefined ||
  token_out === undefined
) {
  console.error(
    "usage: api_shit_1170_swap_queue_post.ts [--base-url <url>] --api-key <key> " +
      "--token-in <id> --amount-in <raw> --token-out <id> " +
      "[--amount-out <raw>] [--dex-id <dex>] [--what <text>] [--when <text>] " +
      "[--why <text>] [--when-at <ms>] [--account <account_id> ...]",
  );
  process.exit(1);
}

// the WHO — the accounts this swap is for. each one must be an account
// the api key belongs to.
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

const when_at_raw = flags.get("--when-at");
let when_at: number | undefined;
if (when_at_raw !== undefined) {
  const parsed = Number(when_at_raw);
  if (!Number.isFinite(parsed)) {
    console.error(
      `api_shit_1170_swap_queue_post: --when-at must be a number of milliseconds: ${when_at_raw}`,
    );
    process.exit(1);
  }
  when_at = parsed;
}

const swap = await api_shit_1170_swap_queue_post(
  base_url,
  {
    what: flags.get("--what"),
    when: flags.get("--when"),
    why: flags.get("--why"),
    whenAt: when_at,
    tokenIn: token_in,
    amountIn: amount_in,
    tokenOut: token_out,
    amountOut: flags.get("--amount-out"),
    dexId: flags.get("--dex-id"),
    accounts: accounts.length > 0 ? accounts : undefined,
  },
  { api_key: flags.get("--api-key") },
);

console.log(
  `SWAP QUEUE: ${swap.swapId}  ${swap.tokenIn} -> ${swap.tokenOut}  ` +
    `amount in ${swap.amountIn}, amount out ${swap.amountOut ?? "(no quote)"}`,
);
console.log(
  `  accounts: ${swap.accounts.map((one) => one.accountId).join(", ") || "(none)"}`,
);
// ========================================
// copyright 2026 by sleet.near
