# @huggies/shit-1170-rex-engine-middleman

clean ts library for interacting with the shit-1170-rex-engine backend routes.

```sh
bun i
# bun run build
bun run build
# publish
bun publish --dry-run
bunx npm login
bun publish --access public
# other
bun run typecheck
bunx prettier . --write
```

---

shit-1170-rex-engine
<br/>
https://shit-1170.com

the base url is a parameter on every call: the frontend passes the
origin of the page it is served from, a bin passes whatever backend it
was told to talk to (`--base-url`).

the routes covered here are the ones this backend owns:

- `/api/shit-1170/*` - our own routes, nothing is proxied
- `/api/trezu/*` - our proxy for the trezu api

## THE LIVE FEED

`/api/shit-1170/feed/ws` is a WEBSOCKET UPGRADE, not a request and a
response, so it does not go through `api_call`. it has its own client:

```ts
import { api_shit_1170_feed_ws } from "@huggies/shit-1170-rex-engine-middleman";

const handle = api_shit_1170_feed_ws(
  "http://127.0.0.1:54733",
  (event) => {
    // event.type is "queue" or "swap"
    if (event.type === "queue") console.log(event.queue.queueId);
    if (event.type === "swap") console.log(event.swap.swapId);
  },
  (message) => console.error(message),
);

// later — close the socket and stop the reconnects
handle.close();
```

the base url is turned into a socket url — `http` becomes `ws`, `https`
becomes `wss` — and the route is appended. the socket is OPEN: it needs
no api key.

the handle reconnects on its own when the socket drops, waiting one
second, then two, then four, up to fifteen. `close()` stops that for
good.

the third-party apis the app talks to are NOT here. the intear api, the
intear dex backend and the rhea indexer each ship their own published
middleman package, so there is one client per api and one place to keep
it:

- `@sleet-js/middleman-intear-api` - `https://api.intea.rs`
- `@sleet-js/middleman-intear-dex-api` - `https://dex-backend.intear.tech`
- `@sleet-js/middleman-rhea-api` - `https://api.rhea.finance`

=====================
<br/>
copyright 2026 by sleet.near
