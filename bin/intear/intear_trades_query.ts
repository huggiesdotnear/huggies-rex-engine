// ========================================
// INTEAR_TRADES_QUERY
// runnable bin for GET /trades via middleman/intear.
//
// argv:
//   bun bin/intear/intear_trades_query.ts [--token t] [--side buy|sell]
//       [--counterparty a.near] [--trader a.near] [--min-usd v]
//       [--fields a,b] [--limit n] [--order newest|oldest]
//       [--after-millis n] [--before-millis n] [--cursor c]
//
// examples:
//   bun bin/intear/intear_trades_query.ts --fields token,price_usd,usd_value --limit 20
//   bun bin/intear/intear_trades_query.ts --token wrap.near --side buy --limit 10
//   bun bin/intear/intear_trades_query.ts --min-usd 10000 --limit 5 --order oldest
// ========================================

import type { trade_requested_field } from "@sleet-js/intear-api-tool-box";
import { api_intear_trades_query } from "../../middleman/intear";
import { split_argv } from "../fun/split_argv";

// --- argv ----------------------------------------------------------
const { flags } = split_argv(process.argv.slice(2));

// --- WHY --- /trades has no `symbol` or `price_usd` column: a trade
// is a swap, so it reports token_in/amount_in against
// token_out/amount_out plus a usd_value for the leg. these defaults
// are the fields a feed row can actually render.
const fields = (flags.get("--fields")?.split(",") ?? [
  "token_in",
  "amount_in",
  "token_out",
  "amount_out",
  "side",
  "usd_value",
  "trader",
]) as trade_requested_field[];
const limit_raw = flags.get("--limit");
const after_millis = flags.get("--after-millis");
const before_millis = flags.get("--before-millis");
const token = flags.get("--token");

const response = await api_intear_trades_query({
  fields,
  token,
  side: flags.get("--side") as never,
  counterparty: flags.get("--counterparty"),
  trader: flags.get("--trader"),
  min_usd: flags.get("--min-usd") as never,
  limit: limit_raw !== undefined ? Number(limit_raw) : undefined,
  order: flags.get("--order") as never,
  after_millis: after_millis !== undefined ? Number(after_millis) : undefined,
  before_millis:
    before_millis !== undefined ? Number(before_millis) : undefined,
  cursor: flags.get("--cursor"),
});

console.log(
  "TRADES",
  `${response.rows.length} row(s) at height ${response.height}, latest_id ${response.latest_id}`,
);
for (const row of response.rows) {
  console.log(" ", row.join("  |  "));
}
if (response.next_cursor !== null) {
  console.log(" next cursor:", response.next_cursor);
}
// ========================================
// copyright 2026 by sleet.near
