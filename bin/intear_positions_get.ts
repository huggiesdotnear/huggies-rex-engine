// ========================================
// INTEAR_POSITIONS_GET
// runnable bin for GET /positions via middleman/intear. the middleman
// logs the framed request + response, so this bin only adds a
// one-line summary.
//
// argv:
//   bun bin/intear_positions_get.ts <account_id> [--limit n]
//
// examples:
//   bun bin/intear_positions_get.ts sleet.near
//   bun bin/intear_positions_get.ts sleet.near --limit 50
// ========================================

import { api_intear_positions_get } from "../middleman/intear";
import { split_argv } from "./fun/split_argv";

// --- argv ----------------------------------------------------------
const { positional, flags } = split_argv(process.argv.slice(2));

const account_id = positional[0];
if (account_id === undefined) {
  console.error(
    "usage: bun bin/intear_positions_get.ts <account_id> [--limit n]",
  );
  process.exit(1);
}

const limit_raw = flags.get("--limit");

const response = await api_intear_positions_get({
  account: account_id,
  limit: limit_raw !== undefined ? Number(limit_raw) : undefined,
});

// --- summary -------------------------------------------------------
console.log(
  "POSITIONS",
  `${response.rows.length} position(s) for ${account_id} at height ${response.height}`,
);
for (const row of response.rows) {
  console.log(" ", row.join("  |  "));
}
// ========================================
// copyright 2026 by sleet.near
