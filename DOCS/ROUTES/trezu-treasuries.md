# TREZU TREASURIES

`GET /api/trezu/user/treasuries` - the treasuries (sputnik daos) an
account belongs to.

proxies `https://api.trezu.app/api/user/treasuries`. the route path
mirrors the upstream trezu path under the `/api/trezu/*` prefix, so the
url alone says which api is being talked to.

## QUERY PARAMS

| query param     | required | notes                                                 |
| --------------- | -------- | ----------------------------------------------------- |
| `accountId`     | yes      | the near account id. trimmed, blank is a `400`        |
| `includeHidden` | no       | `true` to also get hidden treasuries. default `false` |

## RESPONSES

answers `200` with the trezu json array untouched.

on failure it answers json in the shape
`{ "error": { "code", "message" } }`:

- `400` - `accountId` missing or blank
- `502` - trezu answered non-2xx, timed out, or sent invalid json

the error codes are `invalid_account_id`, `trezu_unreachable`,
`trezu_error`, and `trezu_invalid_json`.

## CLIENT

the typed client lives in `middleman/huggies/`:
`api_trezu_treasuries_get({ accountId, includeHidden })`.

it is same-origin: the browser calls our backend, our backend calls
trezu. no upstream auth is needed, trezu's treasuries endpoint is
public.

> --- WHY --- the account id is trimmed and a blank one is rejected
> locally, before the upstream call. trezu answers a missing account
> with a 400, so the local check only saves a request that was
> guaranteed to fail.

=====================
<br/>
copyright 2026 by sleet.near
