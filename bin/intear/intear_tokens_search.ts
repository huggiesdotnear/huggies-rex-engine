// ========================================
// INTEAR_TOKENS_SEARCH
// runnable bin for GET /tokens/search via middleman/intear.
//
// argv:
//   bun bin/intear/intear_tokens_search.ts <q> [--fields a,b] [--limit n]
//       [--holder account.near] [--parent token] [--min-reputation r]
//
// examples:
//   bun bin/intear/intear_tokens_search.ts wnear
//   bun bin/intear/intear_tokens_search.ts 'wrapped near' --fields symbol,price_usd --limit 10
//   bun bin/intear/intear_tokens_search.ts '' --holder sleet.near --limit 10
// ========================================

import type { token_requested_field } from "@sleet-js/intear-api-tool-box";
import {
  api_intear_token_fields,
  api_intear_tokens_search,
} from "../../middleman/intear";
import { split_argv } from "../fun/split_argv";

// --- argv ----------------------------------------------------------
const { positional, flags } = split_argv(process.argv.slice(2));

// q is required but may legitimately be an empty string, so presence
// of the positional is the check, not its truthiness.
if (positional.length === 0) {
  console.error(
    "usage: bun bin/intear/intear_tokens_search.ts <q> [--fields a,b] [--limit n] " +
      "[--holder account.near] [--parent token] [--min-reputation r]",
  );
  process.exit(1);
}

const q = positional[0];

const schema_fields = await api_intear_token_fields();
// --- WHY --- `account_id` is not in the selectable field list on any
// endpoint: it is always the row's leading column, returned whether
// or not it is asked for. defaulting to it here would 400.
const requested = flags.get("--fields")?.split(",") ?? ["symbol", "price_usd"];
for (const field of requested) {
  if (!schema_fields.includes(field)) {
    console.error(
      `invalid --fields "${field}", expected one of ${schema_fields.slice(0, 12).join(", ")}, ...`,
    );
    process.exit(1);
  }
}

const limit_raw = flags.get("--limit");

const response = await api_intear_tokens_search({
  q,
  fields: requested as token_requested_field[],
  limit: limit_raw !== undefined ? Number(limit_raw) : undefined,
  holder: flags.get("--holder"),
  parent: flags.get("--parent"),
  min_reputation: flags.get("--min-reputation") as never,
});

console.log(
  "TOKENS SEARCH",
  `${response.rows.length} row(s) at height ${response.height}`,
);
for (const row of response.rows) {
  console.log(" ", row.join("  |  "));
}
// ========================================
// copyright 2026 by sleet.near
