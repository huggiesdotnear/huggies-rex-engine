# ROUTES

routes and pages

- `/` - serve the static folder

every route under `/api/` is prefixed with the api it fronts, so the
url alone says which backend the route belongs to:

- `/api/shit-1170/*` - our own routes, nothing is proxied
- `/api/trezu/*` - our proxy for the trezu api

a route with more than one bullet point gets its own file in
[`ROUTES/`](./ROUTES/).

### `/api/shit-1170/` - shit-1170 specifics

user info and session managmnets

- `/api/shit-1170/ping` - liveness check, returns `{ "ok": true, "app": "shit-1170" }`

  the typed client is `api_shit_1170_ping_get(base_url)`. it is named
  after us because it is OUR route — nothing is proxied through it.

- `/api/shit-1170/sessions` - turn signed messages into a session key.
  `POST`. the browser sends every account it holds a signed message for,
  the backend verifies each one, and the answer is the ONE session key
  the user has.

  see [`ROUTES/shit-1170-sessions.md`](./ROUTES/shit-1170-sessions.md)

- `/api/shit-1170/session/me` - who does this session key belong to.
  `GET`. the key travels in the `x-session-token` header.

  see [`ROUTES/shit-1170-session-me.md`](./ROUTES/shit-1170-session-me.md)

- `/api/shit-1170/session/rotate` - give an account a NEW session key.
  `POST`. the old key stops working at once.

  see [`ROUTES/shit-1170-session-rotate.md`](./ROUTES/shit-1170-session-rotate.md)

### `/api/trezu/` - trezu specifics

- `/api/trezu/user/treasuries` - the treasuries (sputnik daos) an account
  belongs to. proxies `https://api.trezu.app/api/user/treasuries`.

  see [`ROUTES/trezu-treasuries.md`](./ROUTES/trezu-treasuries.md)

### intear

the intear api is NOT proxied through our backend. the
`@sleet-js/middleman-intear-api` package calls `https://api.intea.rs`
directly from the browser, so there are no `/api/intear/*` routes here
and our backend is never rate limited by intear.

the same goes for the two other public apis the app talks to — the
intear dex backend and the rhea indexer — each with its own published
middleman package:

- `@sleet-js/middleman-intear-api` — `https://api.intea.rs`
- `@sleet-js/middleman-intear-dex-api` — `https://dex-backend.intear.tech`
- `@sleet-js/middleman-rhea-api` — `https://api.rhea.finance`

=====================
<br/>
copyright 2026 by sleet.near
