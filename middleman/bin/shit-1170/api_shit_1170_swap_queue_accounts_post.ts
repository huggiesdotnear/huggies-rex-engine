// ========================================
// API_SHIT_1170_SWAP_QUEUE_ACCOUNTS_POST
// runnable bin for POST /api/shit-1170/swap-queue/{swap_id}/accounts via
// middleman. the middleman logs the framed request + response, so this
// bin only adds a summary.
//
// the account added is ALWAYS the one the api key belongs to — the
// backend refuses anybody else. so the bin takes the account id and
// checks it against the key's own answer, and says so when they differ.
//
//   bun middleman/bin/shit-1170/api_shit_1170_swap_queue_accounts_post.ts \
//     --api-key shit_1170_abc123... \
//     --swap-id 8f14e45f-ceea-467a-9b0d-2b1c2e6c1a11 \
//     --account-id alice.near
// ========================================

import {
  api_shit_1170_swap_queue_accounts_post,
  api_shit_1170_api_key_me_get,
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

const swap_id = flags.get("--swap-id");
const account_id = flags.get("--account-id");
if (swap_id === undefined || account_id === undefined) {
  console.error(
    "usage: api_shit_1170_swap_queue_accounts_post.ts [--base-url <url>] " +
      "--api-key <key> --swap-id <id> --account-id <account_id>",
  );
  process.exit(1);
}

const api_key = flags.get("--api-key");

// --- WHY --- the account is CHECKED against the key here: the backend
// refuses to add anybody but the key's own account, and a 403 says less
// than saying which account the key really belongs to.
const me = await api_shit_1170_api_key_me_get(base_url, { api_key });
if (me.accountId !== account_id) {
  console.error(
    `api_shit_1170_swap_queue_accounts_post: the api key belongs to ${me.accountId}, ` +
      `not to ${account_id} — you may only add yourself`,
  );
  process.exit(1);
}

const swap = await api_shit_1170_swap_queue_accounts_post(
  base_url,
  swap_id,
  { accountId: account_id },
  { api_key },
);

console.log(`SWAP QUEUE ${swap.swapId}: ${swap.accounts.length} account(s)`);
for (const account of swap.accounts) {
  console.log(`    ${account.accountId}  ${account.status}`);
}
// ========================================
// copyright 2026 by sleet.near
