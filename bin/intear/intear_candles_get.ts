// ========================================
// INTEAR_CANDLES_GET
// runnable bin for GET /candles via middleman/intear. the middleman
// logs the framed request + response, so this bin only adds a
// one-line summary.
//
// argv:
//   bun bin/intear/intear_candles_get.ts <token_ids> [resolution]
//       [--count-back n] [--to-millis n] [--quote usd|near] [--series list]
//
// examples:
//   bun bin/intear/intear_candles_get.ts wrap.near
//   bun bin/intear/intear_candles_get.ts wrap.near,usdt.tether-token.near 1h
//   bun bin/intear/intear_candles_get.ts wrap.near 1d --count-back 30
//   bun bin/intear/intear_candles_get.ts wrap.near 1h --quote near --series open,high,low,close
// ========================================

import type {
  candle_quote,
  candle_resolution,
  candle_series,
} from "@sleet-js/intear-api-tool-box";
import { api_intear_candles_get } from "../../middleman/intear";
import { split_argv } from "../fun/split_argv";

// --- argv ----------------------------------------------------------
const { positional, flags } = split_argv(process.argv.slice(2));

const token_ids_raw = positional[0];
if (token_ids_raw === undefined) {
  console.error(
    "usage: bun bin/intear/intear_candles_get.ts <token_ids> [resolution] " +
      "[--count-back n] [--to-millis n] [--quote usd|near] [--series list]",
  );
  process.exit(1);
}

const token_ids = token_ids_raw.split(",").filter((id) => id !== "");
const resolution = (positional[1] ?? "1h") as candle_resolution;
const count_back = flags.get("--count-back");
const to_millis = flags.get("--to-millis");

// --- params --------------------------------------------------------
// --- WHY --- these are validated rather than cast: the tool box types
// the fields as narrow string unions, and an unchecked cast would let
// a typo ("highs") reach the API as a silent 400 instead of a usage
// error here.
const CANDLE_SERIES_FIELDS = [
  "open",
  "high",
  "low",
  "close",
  "volume",
] as const;

const series_raw = flags.get("--series");
let series: candle_series | undefined;
if (series_raw !== undefined) {
  series = series_raw.split(",") as candle_series;
  for (const field of series) {
    if (!CANDLE_SERIES_FIELDS.includes(field)) {
      console.error(
        `invalid --series "${field}", expected one of ${CANDLE_SERIES_FIELDS.join(", ")}`,
      );
      process.exit(1);
    }
  }
}

const response = await api_intear_candles_get({
  tokens: token_ids,
  resolution,
  count_back: count_back !== undefined ? Number(count_back) : undefined,
  to_millis: to_millis !== undefined ? Number(to_millis) : undefined,
  quote: flags.get("--quote") as candle_quote | undefined,
  series,
});

// --- summary -------------------------------------------------------
console.log(
  "CANDLES",
  `${resolution} at height ${response.height}, ` +
    `${Object.keys(response.tokens).length}/${token_ids.length} token(s) returned`,
);
for (const [token, data] of Object.entries(response.tokens)) {
  // `time` is the x-axis shared by every series, so it is the point
  // count — not any single usd/near field, which is optional.
  console.log(` ${token}: ${data.time.length} point(s)`);
}
if (response.missing.length > 0) {
  console.log(" missing:", response.missing.join(", "));
}
// ========================================
// copyright 2026 by sleet.near
