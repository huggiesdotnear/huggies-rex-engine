// ========================================
// API_SHIT_1170_TX_QUEUE_GET
// runnable bin for GET /api/shit-1170/tx-queue via middleman. the
// middleman logs the framed request + response, so this bin only adds
// a summary.
//
//   bun middleman/bin/shit-1170/api_shit_1170_tx_queue_get.ts \
//     --api-key shit_1170_abc123... \
//     --account-id alice.near \
//     --hide-sent
//
// the filters:
//   --account-id    only the queues this account is on
//   --hide-sent     with the account, drop the ones it has already sent
//   --contract-id   only the queues holding a tx for this contract
//   --method        only the queues holding a tx for this method
//   --limit         how many, default 50
//   --offset        where to start, default 0
//
// --- WHY --- --hide-sent stands alone and takes no value: it is a
// switch, and "hide sent = maybe" is not a thing.
//
// --- WHY --- the flag names are kebab-case and the query names are
// snake_case: the flag is what a person types, the query is what the
// route reads. `serde_urlencoded` matches the query key literally, so
// the snake_case spelling is the one that goes on the wire.
// ========================================

import { api_shit_1170_tx_queue_get } from "@huggies/shit-1170-rex-engine-middleman";
import { resolve_base_url } from "../fun/resolve_base_url";
import { split_argv } from "../fun/split_argv";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied. the default is the local backend,
// which binds 0.0.0.0:54733 (see shit_1170_port_fun.rs).
const DEFAULT_BASE_URL = "http://127.0.0.1:54733";

// the flags of this bin that take no value.
const BOOLEAN_FLAGS = ["--hide-sent"];

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const argv = process.argv.slice(2);
const { flags, seen } = split_argv(argv, { boolean_flags: BOOLEAN_FLAGS });

// --- WHY --- the base url is resolved from the raw argv rather than
// the split result: split_argv would put --base-url in the flags map,
// and reading the raw argv keeps one rule for the url: it is never a
// positional.
const base_url = resolve_base_url(argv, DEFAULT_BASE_URL);

// --- THE NUMBERS -------------------------
// a number flag that is not a number is a typo, and it is named here
// rather than sent to the route to be clamped into silence.
function number_flag_fun(name: string): number | undefined {
  const raw = flags.get(name);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    console.error(`${name} must be a number: ${raw}`);
    process.exit(1);
  }
  return parsed;
}

const limit = number_flag_fun("--limit");
const offset = number_flag_fun("--offset");

const list = await api_shit_1170_tx_queue_get(
  base_url,
  {
    account_id: flags.get("--account-id"),
    hide_sent: seen.has("--hide-sent") ? true : undefined,
    contract_id: flags.get("--contract-id"),
    method: flags.get("--method"),
    limit,
    offset,
  },
  { api_key: flags.get("--api-key") },
);

console.log(`TX QUEUE LIST: ${list.items.length} of ${list.total} queue(s)`);
for (const queue of list.items) {
  console.log(
    `  ${queue.queueId}  ${queue.transactions.length} tx  ` +
      `${queue.accounts.length} account(s)  ${queue.what ?? "(no what)"}`,
  );
  for (const account of queue.accounts) {
    console.log(`    ${account.accountId}  ${account.status}`);
  }
}
// ========================================
// copyright 2026 by sleet.near
