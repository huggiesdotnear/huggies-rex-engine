// ========================================
// API_SHIT_1170_API_KEYS_POST
// runnable bin for POST /api/shit-1170/api-keys via middleman. the
// middleman logs the framed request + response, so this bin only adds
// a one-line summary.
//
// the accounts come from a json file, so a real signed message can be
// posted without a wallet in the loop:
//
//   bun middleman/bin/shit-1170/api_shit_1170_api_keys_post.ts \
//     --accounts <path-to-json>
//
// the file holds the accounts array, either as the array itself or as
// the whole request body:
//   { "accounts": [ { "accountId": "...", "publicKey": "...", ... } ] }
//
// --- WHY --- the bin is named after the API KEY and not after the
// session: the credential in it is not a browser session. the user
// signs in once and hands the key to an agent, and the agent holds it
// as a bearer token for as long as it lives.
// ========================================

import { readFileSync } from "node:fs";
import { api_shit_1170_api_keys_post } from "@huggies/shit-1170-rex-engine-middleman";
import type {
  SHIT_1170_API_KEYS_REQUEST,
  SHIT_1170_SIGNED_ACCOUNT,
} from "@huggies/shit-1170-rex-engine-middleman";
import { resolve_base_url } from "../fun/resolve_base_url";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied. the default is the local backend,
// which binds 0.0.0.0:54733 (see shit_1170_port_fun.rs).
const DEFAULT_BASE_URL = "http://127.0.0.1:54733";

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const argv = process.argv.slice(2);
const base_url = resolve_base_url(argv, DEFAULT_BASE_URL);

const accounts_flag = argv.indexOf("--accounts");
const accounts_path =
  accounts_flag === -1 ? undefined : argv[accounts_flag + 1];
if (accounts_path === undefined || accounts_path.length === 0) {
  console.error(
    "usage: api_shit_1170_api_keys_post.ts [--base-url <url>] --accounts <file.json>",
  );
  process.exit(1);
}

const raw = readFileSync(accounts_path, "utf8");
const parsed = JSON.parse(raw) as
  SHIT_1170_API_KEYS_REQUEST | SHIT_1170_SIGNED_ACCOUNT[];
// the file may hold the accounts array on its own or the whole body.
const accounts = Array.isArray(parsed) ? parsed : parsed.accounts;

const keys = await api_shit_1170_api_keys_post(base_url, { accounts });

console.log(`API KEYS: ${keys.keys.length} account(s)`);
for (const entry of keys.keys) {
  console.log(
    `  ${entry.accountId}  ${
      entry.created ? "created" : "existing"
    }  key: ${entry.apiKey.slice(0, 8)}…`,
  );
}
// ========================================
// copyright 2026 by sleet.near
