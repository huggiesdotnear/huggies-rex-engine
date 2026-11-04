// ========================================
// API_SHIT_1170_TX_QUEUE_STATS_METHODS_GET
// runnable bin for GET /api/shit-1170/tx-queue/stats/methods via
// middleman. the middleman logs the framed request + response, so this
// bin only adds a summary.
//
//   bun middleman/bin/shit-1170/api_shit_1170_tx_queue_stats_methods_get.ts \
//     --api-key shit_1170_abc123... \
//     --limit 20
//
// --- WHY --- a number flag that is not a number is named here rather
// than sent to the route to be clamped into silence.
// ========================================

import { api_shit_1170_tx_queue_stats_methods_get } from "@huggies/shit-1170-rex-engine-middleman";
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

const limit_raw = flags.get("--limit");
let limit: number | undefined;
if (limit_raw !== undefined) {
  const parsed = Number(limit_raw);
  if (!Number.isFinite(parsed)) {
    console.error(`--limit must be a number: ${limit_raw}`);
    process.exit(1);
  }
  limit = parsed;
}

const stats = await api_shit_1170_tx_queue_stats_methods_get(
  base_url,
  { limit },
  { api_key: flags.get("--api-key") },
);

console.log(`TX QUEUE METHOD STATS: ${stats.items.length} method(s)`);
for (const stat of stats.items) {
  console.log(`  ${stat.contractId}.${stat.method}  ${stat.count}`);
}
// ========================================
// copyright 2026 by sleet.near
