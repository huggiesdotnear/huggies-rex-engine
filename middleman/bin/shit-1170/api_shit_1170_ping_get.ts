// ========================================
// API_SHIT_1170_PING_GET
// runnable bin for GET /api/shit-1170/ping via middleman. the
// middleman logs the framed request + response, so this bin only adds
// a one-line summary.
//
// argv:
//   bun middleman/bin/shit-1170/api_shit_1170_ping_get.ts [--base-url <url>]
// ========================================

import { api_shit_1170_ping_get } from "@huggies/shit-1170-middleman";
import { resolve_base_url } from "../fun/resolve_base_url";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied. the default is the local backend,
// which binds 0.0.0.0:54733 (see shit_1170_port_fun.rs).
const DEFAULT_BASE_URL = "http://127.0.0.1:54733";

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const argv = process.argv.slice(2);
const base_url = resolve_base_url(argv, DEFAULT_BASE_URL);

const ping = await api_shit_1170_ping_get(base_url);

console.log("PING", ping.ok ? "ok" : "not ok", `app: ${ping.app}`);
// ========================================
// copyright 2026 by sleet.near
