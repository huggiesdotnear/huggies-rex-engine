// ========================================
// API_HUGGIES_SESSIONS_POST
// runnable bin for POST /api/huggies/sessions via middleman. the
// middleman logs the framed request + response, so this bin only adds
// a one-line summary.
//
// the accounts come from a json file, so a real signed message can be
// posted without a wallet in the loop:
//
//   bun middleman/bin/huggies/api_huggies_sessions_post.ts \
//     --accounts <path-to-json>
//
// the file holds the accounts array, either as the array itself or as
// the whole request body:
//   { "accounts": [ { "accountId": "...", "publicKey": "...", ... } ] }
// ========================================

import { readFileSync } from "node:fs";
import { api_huggies_sessions_post } from "@huggies/huggies-rex-engine-middleman";
import type {
  HUGGIES_SIGNED_ACCOUNT,
  HUGGIES_SESSIONS_REQUEST,
} from "@huggies/huggies-rex-engine-middleman";
import { resolve_base_url } from "../fun/resolve_base_url";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied. the default is the local backend,
// which binds 0.0.0.0:54733 (see huggies_port_fun.rs).
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
    "usage: api_huggies_sessions_post.ts [--base-url <url>] --accounts <file.json>",
  );
  process.exit(1);
}

const raw = readFileSync(accounts_path, "utf8");
const parsed = JSON.parse(raw) as
  HUGGIES_SESSIONS_REQUEST | HUGGIES_SIGNED_ACCOUNT[];
// the file may hold the accounts array on its own or the whole body.
const accounts = Array.isArray(parsed) ? parsed : parsed.accounts;

const sessions = await api_huggies_sessions_post(base_url, { accounts });

console.log(
  "SESSIONS",
  sessions.created ? "created" : "existing",
  `user: ${sessions.userId}`,
  `accounts: ${sessions.accounts.length}`,
  `key: ${sessions.sessionKey.slice(0, 8)}…`,
);
// ========================================
// copyright 2026 by sleet.near
