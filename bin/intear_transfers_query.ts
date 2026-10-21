// ========================================
// INTEAR_TRANSFERS_QUERY
// runnable bin for GET /transfers via middleman/intear.
//
// argv:
//   bun bin/intear_transfers_query.ts <account_id> [--token t] [--sender a.near]
//       [--receiver a.near] [--kind k] [--fields a,b] [--limit n]
//       [--order newest|oldest] [--cursor c]
//
// examples:
//   bun bin/intear_transfers_query.ts sleet.near --limit 20
//   bun bin/intear_transfers_query.ts sleet.near --sender sleet.near --kind mint
// ========================================

import type { transfer_requested_field } from "@sleet-js/intear-api-tool-box";
import { api_intear_transfers_query } from "../middleman/intear";
import { split_argv } from "./fun/split_argv";

// --- argv ----------------------------------------------------------
const { positional, flags } = split_argv(process.argv.slice(2));

// --- WHY --- the api rejects a transfer query with no party: an
// unfiltered history is unbounded, so it answers
// "history needs a `sender`, `receiver` or `account`". requiring the
// positional here fails with a usage line instead of a 400.
const account_id = positional[0];
if (account_id === undefined) {
  console.error(
    "usage: bun bin/intear_transfers_query.ts <account_id> [--token t] [--sender a.near] " +
      "[--receiver a.near] [--kind k] [--fields a,b] [--limit n] [--order newest|oldest]",
  );
  process.exit(1);
}

// typed as the requested-field union so the returned row stays a
// tuple and `row.join` typechecks. there is no `symbol` column on
// /transfers — only the raw token id.
const fields = (flags.get("--fields")?.split(",") ?? [
  "token",
  "sender",
  "receiver",
  "amount",
  "kind",
]) as transfer_requested_field[];
const limit_raw = flags.get("--limit");
const after_millis = flags.get("--after-millis");
const before_millis = flags.get("--before-millis");

const response = await api_intear_transfers_query({
  fields,
  account: account_id,
  token: flags.get("--token"),
  sender: flags.get("--sender"),
  receiver: flags.get("--receiver"),
  kind: flags.get("--kind") as never,
  include_transactions: flags.has("--include-transactions") || undefined,
  limit: limit_raw !== undefined ? Number(limit_raw) : undefined,
  order: flags.get("--order") as never,
  after_millis: after_millis !== undefined ? Number(after_millis) : undefined,
  before_millis:
    before_millis !== undefined ? Number(before_millis) : undefined,
  cursor: flags.get("--cursor"),
});

console.log(
  "TRANSFERS",
  `${response.rows.length} row(s) at height ${response.height}`,
);
for (const row of response.rows) {
  console.log(" ", row.join("  |  "));
}
if (response.next_cursor !== null) {
  console.log(" next cursor:", response.next_cursor);
}
// ========================================
// copyright 2026 by sleet.near
