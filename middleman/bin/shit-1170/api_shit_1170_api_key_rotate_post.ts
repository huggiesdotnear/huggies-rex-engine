// ========================================
// API_SHIT_1170_API_KEY_ROTATE_POST
// runnable bin for POST /api/shit-1170/api-key/rotate via middleman.
// the middleman logs the framed request + response, so this bin only
// adds a one-line summary.
//
// the accounts come from a json file, so a real signed message can be
// posted without a wallet in the loop:
//
//   bun middleman/bin/shit-1170/api_shit_1170_api_key_rotate_post.ts \
//     --accounts <path-to-json>
//
// the file holds ONE signed account, either as the array itself or as
// the whole request body:
//   { "accounts": [ { "accountId": "...", "publicKey": "...", ... } ] }
//
// --- WHY --- the rotation is proved by the SIGNED MESSAGE and not by
// the old key: the old key is what a thief has. a rotation that only
// needed the old key could be done by the thief, who would lock the
// owner out while keeping access. the signed message proves the owner
// still holds the account's NEAR key.
//
// --- WHY --- --api-key is optional here: the route proves the ownership
// with the signed message, so the key is not needed. it is still sent
// when it is given, because the header is the route's usual way of
// saying who is calling.
// ========================================

import { readFileSync } from "node:fs";
import { api_shit_1170_api_key_rotate_post } from "@huggies/shit-1170-rex-engine-middleman";
import type {
  SHIT_1170_API_KEYS_REQUEST,
  SHIT_1170_SIGNED_ACCOUNT,
} from "@huggies/shit-1170-rex-engine-middleman";
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

const accounts_flag = argv.indexOf("--accounts");
const accounts_path =
  accounts_flag === -1 ? undefined : argv[accounts_flag + 1];
if (accounts_path === undefined || accounts_path.length === 0) {
  console.error(
    "usage: api_shit_1170_api_key_rotate_post.ts [--base-url <url>] --accounts <file.json>",
  );
  process.exit(1);
}

const raw = readFileSync(accounts_path, "utf8");
const parsed = JSON.parse(raw) as
  SHIT_1170_API_KEYS_REQUEST | SHIT_1170_SIGNED_ACCOUNT[];
// the file may hold the accounts array on its own or the whole body.
const accounts = Array.isArray(parsed) ? parsed : parsed.accounts;

const key = await api_shit_1170_api_key_rotate_post(
  base_url,
  { accounts },
  { api_key: flags.get("--api-key") },
);

console.log(`API KEY ROTATED: ${key.accountId}`);
console.log(`  key: ${key.apiKey}`);
console.log("  the old key stops working at once — update whatever holds it.");
// ========================================
// copyright 2026 by sleet.near
