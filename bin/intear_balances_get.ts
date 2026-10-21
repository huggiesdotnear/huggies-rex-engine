// ========================================
// INTEAR_BALANCES_GET
// runnable bin for GET /balances via middleman/intear. the middleman
// logs the framed request + response, so this bin only adds a
// one-line summary.
//
// argv:
//   bun bin/intear_balances_get.ts <account_id> [sources]
//       [--tokens a,b] [--token-fields f1,f2]
//
// examples:
//   bun bin/intear_balances_get.ts sleet.near
//   bun bin/intear_balances_get.ts sleet.near direct,native,rhea
//   bun bin/intear_balances_get.ts sleet.near direct --tokens wrap.near --token-fields symbol,balance
// ========================================

import { api_intear_balances_get } from "../middleman/intear";
import { print_summary } from "./fun/print_summary";
import { split_argv } from "./fun/split_argv";

// --- argv ----------------------------------------------------------
const { positional, flags } = split_argv(process.argv.slice(2));

const account_id = positional[0];
if (account_id === undefined) {
  console.error(
    "usage: bun bin/intear_balances_get.ts <account_id> [sources] " +
      "[--tokens a,b] [--token-fields f1,f2]",
  );
  process.exit(1);
}

// --- WHY --- `sources` has no server-side default in the tool box
// types, so default to all three here rather than making every
// invocation remember the list.
const sources_raw = positional[1] ?? "direct,native,rhea";
const sources = sources_raw.split(",") as ("direct" | "native" | "rhea")[];
const tokens = flags.get("--tokens")?.split(",");
const token_fields = flags.get("--token-fields")?.split(",") as never;

const response = await api_intear_balances_get({
  account: account_id,
  sources,
  tokens,
  token_fields: token_fields ?? (["symbol"] as never),
});

// --- summary -------------------------------------------------------
print_summary(
  "BALANCES",
  `${response.balances.rows.length} balance(s) for ${account_id} at height ${response.height}`,
);
for (const row of response.balances.rows) {
  console.log(" ", row.join("  |  "));
}
// --- WHY --- errors are per-source, not a failed request: the call
// succeeded for the sources that answered, so print them instead of
// hiding the result.
for (const [source, error] of Object.entries(response.errors ?? {})) {
  console.log(` ${source} failed:`, error);
}
if (response.unknown.length > 0) {
  console.log(" unknown tokens:", response.unknown.join(", "));
}
// ========================================
// copyright 2026 by sleet.near
