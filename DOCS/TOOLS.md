# TOOLS

Intear API
<br/>
https://docs.intear.tech/api/

the base url is `https://api.intea.rs`, no api key. every page of the
docs is also markdown, at its url with `.md` in place of the trailing
slash — <https://docs.intear.tech/api/llms-full.txt> has all of them in
one file.

## THE MIDDLEMAN

every call goes through `middleman/intear/` — one wrapper per endpoint
in `fun/`, shared plumbing in `stuff/`. the wrappers call
`api.intea.rs` **directly from the browser**, not through our backend:
routing it through the backend would spend the backend's rate limit on
data the browser can fetch itself.

| wrapper | endpoint |
|---|---|
| `api_intear_tokens_get` | `/tokens` |
| `api_intear_tokens_search` | `/tokens/search` |
| `api_intear_token_fields` | `/schema` |
| `api_intear_trades_query` | `/trades` |
| `api_intear_transfers_query` | `/transfers` |
| `api_intear_activity_query` | `/activity` |
| `api_intear_candles_get` | `/candles` |
| `api_intear_balances_get` | `/balances` |
| `api_intear_holders_get` | `/holders` |
| `api_intear_positions_get` | `/positions` |
| `api_intear_prices_at_get` | `/prices/at` |
| `api_intear_accounts_search` | `/accounts/search` |

each wrapper logs a framed block (`=====`) with the url, the status and
the full response, so a grep for `=====` finds every api call in one
place.

## QUERY ENCODING

the query string is intear's own format, not generic url ones — see
`middleman/intear/stuff/intear_build_query.ts`. three rules that are not
obvious:

- **`where` keys are unprefixed.** `where.min_reputation=NotFake`, not
  `where.min_reputation` as a dotted path. the builder unwraps `where`.
- **lists are comma separated.** `fields=a,b`, not `fields=a&fields=b`.
- **`sort` is `-field` for descending.** `sort: { by, desc }` becomes
  `sort=-volume_usd_24h`. a url-encoded boolean arrives as the string
  `"true"`, which the server rejects.

`account_id` is **not** a requestable field on any endpoint. it is
always the row's leading column, returned whether or not it is asked
for. asking for it is a `400 unknown_field`.

> --- WHY --- the url has a byte limit, and it is a **414**, not a
> `400`. the ids go in the query string of a GET, and past a certain
> length the request is refused outright:
>
> | ids | url | result |
> |---|---|---|
> | 170 long ids | 7.9KB | 200 |
> | 180 long ids | 8.4KB | **414** |
> | 600 short ids | 7.1KB | 200 |
>
> so the limit is on the url BYTES, not on the number of ids. the
> token ids vary a lot in length — from `wrap.near` to a 64-char hex
> address plus a `.factory.bridge.near` suffix — so a request must be
> sized by the encoded url length, not by a fixed id count. see
> `frontend/lib/ts/token_icon_fetch.ts`.

## THE ENDPOINTS WE USE

### GET /tokens

tokens, filtered and sorted, once.

| param | notes |
|---|---|
| `fields` | **required** — only the fields you show |
| `ids` | up to 2,000 token ids |
| `where` | `parent`, `min_reputation`, `deleted`, `min`, `max`, `created_after_millis` |
| `sort` | `{ "by": "<numeric field>", "desc": true }` |
| `limit`, `offset` | a page of the sorted tokens. **both need `sort`** |

the result carries `total` — how many tokens matched, *before* `limit`
and `offset` — plus `columns` and `rows`. without a `sort`, tokens come
back in account id order.

### GET /tokens/search

tokens matching a query, best match first.

| param | notes |
|---|---|
| `q` | **required** — matched against symbol, name, account id and social links |
| `fields` | **required** |
| `limit` | **at most 100**, default 10 |
| `min_reputation` | default `Unknown` |
| `holder` | an account whose tokens rank higher |
| `parent` | only tokens directly under this account |

the result has no `total`.

## WHAT THE DATA COSTS

measured on mainnet, ~7,400 indexed tokens:

| request | size |
|---|---|
| every token, without `icon` | **~720KB** |
| every token, with `icon` | **~21MB** |
| top 100, with `icon` | ~320KB |

the `icon` field is a full base64 data uri per token, and it is almost
the entire payload. that is why the app splits token fields into a
durable half (symbol, decimals, icon — cached forever) and a volatile
half (price_usd, reputation, holders, volume_usd_24h, market_cap_usd —
always refetched). see `lib/ts/token_info.ts`.

## REPUTATION

`min_reputation` filters the token set hard:

| filter | tokens matched |
|---|---|
| (none) | ~7,400 |
| `Unknown` | ~7,400 |
| `NotFake` | **~87** |
| `Reputable` | **~18** |

> --- WHY --- this matters for our own token. `shit-1170.meme-cooking.near`
> is `reputation: "Unknown"`, so it is **absent** from any `NotFake` or
> `Reputable` list. a filter that cleans up spam and test tokens also
> hides our own token from the discover page.

## THE BINS

every endpoint has a runnable bin in `bin/`, which uses the same
middleman and so logs the same framed blocks.

```sh
bun bin/intear_tokens_get.ts wrap.near --fields symbol,price_usd --limit 20
bun bin/intear_tokens_get.ts --sort volume_usd_24h --desc --limit 20
bun bin/intear_tokens_search.ts shit-1170 --fields symbol,price_usd --limit 10
```

=====================
<br/>
copyright 2026 by sleet.near
