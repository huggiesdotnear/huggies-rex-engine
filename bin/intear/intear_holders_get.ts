// ========================================
// INTEAR_HOLDERS_GET
// runnable bin for GET /holders via middleman/intear. the middleman
// logs the framed request + response, so this bin only adds a
// one-line summary.
//
// argv:
//   bun bin/intear/intear_holders_get.ts <token_id> [--limit n] [--cursor c]
//
// examples:
//   bun bin/intear/intear_holders_get.ts wrap.near
//   bun bin/intear/intear_holders_get.ts wrap.near --limit 20
//   bun bin/intear/intear_holders_get.ts wrap.near --cursor eyJ...   # next page
// ========================================

import { api_intear_holders_get } from "../../middleman/intear";
import { split_argv } from "../fun/split_argv";

// --- argv ----------------------------------------------------------
const { positional, flags } = split_argv(process.argv.slice(2));

const token_id = positional[0];
if (token_id === undefined) {
  console.error(
    "usage: bun bin/intear/intear_holders_get.ts <token_id> [--limit n] [--cursor c]",
  );
  process.exit(1);
}

const limit_raw = flags.get("--limit");

const response = await api_intear_holders_get({
  token: token_id,
  limit: limit_raw !== undefined ? Number(limit_raw) : undefined,
  cursor: flags.get("--cursor"),
});

// --- summary -------------------------------------------------------
console.log(
  "HOLDERS",
  `${response.rows.length} of ${response.total} holder(s) at height ${response.height}`,
);
for (const row of response.rows) {
  console.log(" ", row.join("  |  "));
}
if (response.next_cursor !== null) {
  console.log(" next cursor:", response.next_cursor);
}
// ========================================
// copyright 2026 by sleet.near
