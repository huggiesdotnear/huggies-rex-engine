// ========================================
// API_TREZU_TREASURIES_GET
// runnable bin for GET /api/trezu/user/treasuries via middleman/huggies.
// the middleman logs the framed request + response, so this bin only
// adds a summary.
//
// argv:
//   bun bin/huggies/api_trezu_treasuries_get.ts <account_id> \
//       [--include-hidden] [--base-url <url>]
// ========================================

import { api_trezu_treasuries_get } from "../../middleman/huggies";
import { resolve_base_url } from "../fun/resolve_base_url";
import { split_argv } from "../fun/split_argv";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied.
const DEFAULT_BASE_URL = "http://127.0.0.1:54733";

// --- FLAGS ---------------------------------------------------------
// the flags of this bin that take no value.
const BOOLEAN_FLAGS = ["--include-hidden"];

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const { positional, seen } = split_argv(process.argv.slice(2), {
  boolean_flags: BOOLEAN_FLAGS,
});

const account_id = positional[0];
if (account_id === undefined) {
  console.error(
    "usage: bun bin/huggies/api_trezu_treasuries_get.ts <account_id> " +
      "[--include-hidden] [--base-url <url>]",
  );
  process.exit(1);
}

// --- WHY --- the base url is resolved from the raw argv rather than
// the split result: split_argv would put --base-url in the flags map,
// and reading the raw argv keeps one rule for the url: it is never a
// positional.
const base_url = resolve_base_url(process.argv.slice(2), DEFAULT_BASE_URL);

const treasuries = await api_trezu_treasuries_get(base_url, {
  accountId: account_id,
  includeHidden: seen.has("--include-hidden") ? true : undefined,
});

console.log("TREASURIES", `${treasuries.length} for ${account_id}`);
for (const treasury of treasuries) {
  const name = treasury.config?.name ?? "(no name)";
  console.log(
    " ",
    treasury.daoId,
    `| ${name}`,
    treasury.isMember ? "| member" : "",
    treasury.isHidden ? "| hidden" : "",
  );
}
// ========================================
// copyright 2026 by sleet.near
