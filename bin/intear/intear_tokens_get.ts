// ========================================
// INTEAR_TOKENS_GET
// runnable bin for GET /tokens via middleman/intear. the middleman
// logs the framed request + response, so this bin only adds a
// one-line summary.
//
// argv:
//   bun bin/intear/intear_tokens_get.ts [token_ids] [--fields a,b] [--limit n]
//       [--sort field] [--desc] [--where key=value] [--account account.near]
//
// examples:
//   bun bin/intear/intear_tokens_get.ts wrap.near
//   bun bin/intear/intear_tokens_get.ts wrap.near --fields symbol,price_usd,volume_usd_24h
//   bun bin/intear/intear_tokens_get.ts --fields symbol,volume_usd_24h --limit 20 --sort volume_usd_24h --desc
//   bun bin/intear/intear_tokens_get.ts --where min_reputation=NotFake --limit 20
// ========================================

import type {
  token_requested_field,
  token_sort,
} from "@sleet-js/intear-api-tool-box";
import {
  api_intear_token_fields,
  api_intear_tokens_get,
} from "../../middleman/intear";
import { split_argv } from "../fun/split_argv";

// --- FLAGS ---------------------------------------------------------
// the flags of this bin that take no value.
const BOOLEAN_FLAGS = ["--desc"];

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const { positional, flags, seen } = split_argv(process.argv.slice(2), {
  boolean_flags: BOOLEAN_FLAGS,
});

// --- WHY --- nothing here is required: omitting the token ids and
// every filter is a valid "give me the top tokens by volume" call, so
// this bin never exits on missing args. it only prints usage when it
// is handed no arguments at all, which is far more likely to be a
// mistaken invocation than a deliberate "call with defaults".
if (process.argv.length <= 2) {
  console.error(
    "usage: bun bin/intear/intear_tokens_get.ts [token_ids] [--fields a,b] [--limit n] " +
      "[--sort field] [--desc] [--where key=value] [--account account.near]",
  );
  process.exit(1);
}

const token_ids_raw = positional[0];
const token_ids =
  token_ids_raw === undefined
    ? []
    : token_ids_raw.split(",").filter((id) => id !== "");

// --- params --------------------------------------------------------
// --- WHY --- `where` takes one key=value here rather than a json blob:
// it maps straight onto the query string (where keys are unprefixed),
// so `min_reputation=NotFake` needs no json at all.
const where: Record<string, string> = {};
const where_raw = flags.get("--where");
if (where_raw !== undefined) {
  for (const pair of where_raw.split(",")) {
    const eq = pair.indexOf("=");
    if (eq === -1) {
      console.error(`invalid --where pair "${pair}", expected key=value`);
      process.exit(1);
    }
    where[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
}

const fields_raw = flags.get("--fields");
const sort_field = flags.get("--sort");
const limit_raw = flags.get("--limit");

// --- WHY --- the tool box types fields as a string union, so a raw
// --fields string is validated against the live schema instead of
// cast. asking the API for a field that does not exist would only
// surface as a 400 from the server.
const schema_fields = await api_intear_token_fields();
const requested =
  fields_raw !== undefined
    ? fields_raw.split(",")
    : ["account_id", "symbol", "price_usd"];
for (const field of requested) {
  if (!schema_fields.includes(field)) {
    console.error(
      `invalid --fields "${field}", expected one of ${schema_fields.slice(0, 12).join(", ")}, ...`,
    );
    process.exit(1);
  }
}

const response = await api_intear_tokens_get({
  ids: token_ids.length > 0 ? token_ids : undefined,
  fields: requested as token_requested_field[],
  limit: limit_raw !== undefined ? Number(limit_raw) : undefined,
  where: Object.keys(where).length > 0 ? where : undefined,
  sort:
    sort_field !== undefined
      ? ({ by: sort_field, desc: seen.has("--desc") } as token_sort)
      : undefined,
});

// --- summary -------------------------------------------------------
console.log(
  "TOKENS",
  `${response.rows.length} row(s) at height ${response.height}` +
    (sort_field !== undefined ? ` sorted by ${sort_field}` : ""),
);
for (const row of response.rows) {
  console.log(" ", row.join("  |  "));
}
// ========================================
// copyright 2026 by sleet.near
