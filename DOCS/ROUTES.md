# ROUTES

routes and pages

- `/` - serve the static folder

### `/api/huggies/` - huggies specifics

user info and session managmnets

- `/api/huggies/ping` - liveness check, returns `{ "ok": true, "app": "huggies-rex-engine" }`
- `/api/huggies/treasuries` - the treasuries (sputnik daos) an account
  belongs to. proxies `https://api.trezu.app/api/user/treasuries`.

  | query param     | required | notes                                                 |
  | --------------- | -------- | ----------------------------------------------------- |
  | `accountId`     | yes      | the near account id. trimmed, blank is a `400`        |
  | `includeHidden` | no       | `true` to also get hidden treasuries. default `false` |

  answers `200` with the trezu json array untouched. on failure it
  answers json in the shape `{ "error": { "code", "message" } }`:

  - `400` - `accountId` missing or blank
  - `502` - trezu answered non-2xx, timed out, or sent invalid json

  the typed client lives in `middleman/huggies/`:
  `api_huggies_treasuries_get({ accountId, includeHidden })`.

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
