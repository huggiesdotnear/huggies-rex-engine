// ========================================
// API_SHIT_1170_FEED_WS
// runnable bin for GET /api/shit-1170/feed/ws via middleman. the
// middleman owns the socket, so this bin only prints what comes out of
// it.
//
//   bun middleman/bin/shit-1170/api_shit_1170_feed_ws.ts \
//     --base-url http://127.0.0.1:54733
//
// the bin LISTENS until it is stopped. it reconnects on its own when
// the socket drops, so a run that goes quiet for a while is a backend
// that is down, not a bin that gave up.
//
// --- WHY --- THE BIN LISTENS AND DOES NOT EXIT: the socket is a
// stream, and a stream has no end to wait for. the reader stops it
// with ctrl+c.
//
// --- WHY --- THE API KEY IS NOT TAKEN: the socket is OPEN, exactly
// like the queue list it replaces.
// ========================================

import { api_shit_1170_feed_ws } from "@huggies/shit-1170-rex-engine-middleman";
import { resolve_base_url } from "../fun/resolve_base_url";

// --- CONFIG --------------------------------------------------------
// used when no argv is supplied. the default is the local backend,
// which binds 0.0.0.0:54733 (see shit_1170_port_fun.rs).
const DEFAULT_BASE_URL = "http://127.0.0.1:54733";

// --- argv ----------------------------------------------------------
// argv[0] is bun, argv[1] is this script, so real args start at 2.
const argv = process.argv.slice(2);

// --- WHY --- the base url is resolved from the raw argv rather than
// the split result: split_argv would put --base-url in the flags map,
// and reading the raw argv keeps one rule for the url: it is never a
// positional.
const base_url = resolve_base_url(argv, DEFAULT_BASE_URL);

console.log(`FEED WS: listening on ${base_url}`);

const handle = api_shit_1170_feed_ws(
  base_url,
  (event) => {
    if (event.type === "queue") {
      const queue = event.queue;
      console.log(
        `QUEUE ${queue.queueId}  ${queue.transactions.length} tx  ` +
          `${queue.accounts.length} account(s)  ${queue.what ?? "(no what)"}`,
      );
      for (const account of queue.accounts) {
        console.log(`    ${account.accountId}  ${account.status}`);
      }
      return;
    }
    const swap = event.swap;
    console.log(
      `SWAP  ${swap.swapId}  ${swap.amountIn} ${swap.tokenIn} -> ` +
        `${swap.tokenOut}  ${swap.what ?? "(no what)"}`,
    );
  },
  (message) => {
    console.error(message);
  },
);

// --- WHY --- THE SOCKET IS CLOSED ON THE WAY OUT: a bin that is
// stopped must not leave the socket open behind it.
const stop = () => {
  handle.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
// ========================================
// copyright 2026 by sleet.near
