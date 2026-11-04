// ========================================
// API_SHIT_1170_API_KEY_ME_GET
// runnable bin for GET /api/shit-1170/api-key/me via middleman. the
// middleman logs the framed request + response, so this bin only adds
// a one-line summary.
//
//   bun middleman/bin/shit-1170/api_shit_1170_api_key_me_get.ts \
//     --api-key shit_1170_abc123...
//
// --- WHY --- this is the bin that tells an agent whether the key it
// holds is still good: a 401 means the key is not one of ours, and a
// 200 names the account it belongs to.
// ========================================

import { api_shit_1170_api_key_me_get } from "@huggies/shit-1170-rex-engine-middleman";
import { resolve_base_url } from "../fun/resolve_base_url";
import { split_argv } from "../fun/split_argv";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied. the default is the local backend,
// which binds 0.0.0.0:54733 (see shit_1170_port_fun.rs).
const DEFAULT_BASE_URL = "http://127.0.0.1:54733";

// the flags of this bin that take no value.
const BOOLEAN_FLAGS: string[] = [];

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const argv = process.argv.slice(2);
const { flags } = split_argv(argv, { boolean_flags: BOOLEAN_FLAGS });

// --- WHY --- the base url is resolved from the raw argv rather than
// the split result: split_argv would put --base-url in the flags map,
// and reading the raw argv keeps one rule for the url: it is never a
// positional.
const base_url = resolve_base_url(argv, DEFAULT_BASE_URL);

const me = await api_shit_1170_api_key_me_get(base_url, {
  api_key: flags.get("--api-key"),
});

console.log(`API KEY ME: ${me.accountId}`);
console.log(`  created: ${new Date(me.createdAt).toISOString()}`);
console.log(`  updated: ${new Date(me.updatedAt).toISOString()}`);
// ========================================
// copyright 2026 by sleet.near
