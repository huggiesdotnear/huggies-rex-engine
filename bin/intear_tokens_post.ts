// ========================================
// INTEAR_TOKENS_POST
// runnable bin for POST /tokens via middleman/intear. the same
// endpoint as GET /tokens, with the params in a JSON body.
//
// this is the one to use when a list of token ids does not fit in a
// url: the body limit is 64KB, against ~8KB for the url.
//
// argv:
//   bun bin/intear_tokens_post.ts [token_ids] [--fields a,b] [--limit n]
//       [--sort field] [--desc] [--where key=value]
//
// examples:
//   bun bin/intear_tokens_post.ts wrap.near
//   bun bin/intear_tokens_post.ts --fields symbol,icon --limit 20 --sort volume_usd_24h --desc
// ========================================

import type {
  token_requested_field,
  token_sort,
} from "@sleet-js/intear-api-tool-box";
import {
  api_intear_token_fields,
  api_intear_tokens_post,
} from "../middleman/intear";
import { split_argv } from "./fun/split_argv";

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const { positional, flags, seen } = split_argv(process.argv.slice(2));

if (process.argv.length <= 2) {
  console.error(
    "usage: bun bin/intear_tokens_post.ts [token_ids] [--fields a,b] " +
      "[--limit n] [--sort field] [--desc] [--where key=value]",
  );
  process.exit(1);
}

const token_ids_raw = positional[0];
const token_ids =
  token_ids_raw === undefined
    ? []
    : token_ids_raw.split(",").filter((id) => id !== "");

const fields_raw = flags.get("--fields");
const sort_field = flags.get("--sort");
const limit_raw = flags.get("--limit");

// --- WHY --- `account_id` is not in the selectable field list on any
// endpoint: it is always the row's leading column, returned whether
// or not it is asked for. defaulting to it here would 400.
const schema_fields = await api_intear_token_fields();
const requested =
  fields_raw !== undefined
    ? fields_raw.split(",")
    : ["symbol", "price_usd"];
for (const field of requested) {
  if (!schema_fields.includes(field)) {
    console.error(
      `invalid --fields "${field}", expected one of ${schema_fields.slice(0, 12).join(", ")}, ...`,
    );
    process.exit(1);
  }
}

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

const response = await api_intear_tokens_post({
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
  "TOKENS POST",
  `${response.rows.length} row(s) at height ${response.height}` +
    (sort_field !== undefined ? ` sorted by ${sort_field}` : ""),
);
for (const row of response.rows) {
  console.log(" ", row.join("  |  "));
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
