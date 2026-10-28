# ROUTES

routes and pages

- `/` - serve the static folder

every route under `/api/` is prefixed with the api it fronts, so the
url alone says which backend the route belongs to:

- `/api/huggies/*` - our own routes, nothing is proxied
- `/api/trezu/*` - our proxy for the trezu api
- `/api/near/*` - near blockchain interaction

a route with more than one bullet point gets its own file in
[`ROUTES/`](./ROUTES/).

### `/api/huggies/` - huggies specifics

user info and session managmnets

- `/api/huggies/ping` - liveness check, returns `{ "ok": true, "app": "huggies-rex-engine" }`

  the typed client is `api_huggies_ping_get(base_url)`. it is named
  after us because it is OUR route — nothing is proxied through it.

### `/api/trezu/` - trezu specifics

- `/api/trezu/user/treasuries` - the treasuries (sputnik daos) an account
  belongs to. proxies `https://api.trezu.app/api/user/treasuries`.

  see [`ROUTES/trezu-treasuries.md`](./ROUTES/trezu-treasuries.md)

### `/api/near/` near blockchain interaction

- 👀 `/api/near/contract/{contract_id}/{method}`
- 👀 `/api/near/token/`

### intear

the intear api is NOT proxied through our backend. `middleman/intear/`
calls `https://api.intea.rs` directly from the browser, so there are
no `/api/intear/*` routes here and our backend is never rate limited
by intear.

=====================
<br/>
copyright 2026 by sleet.near
