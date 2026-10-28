# bin

cli bins for talking to our backend and to the intear api. every bin
imports the middleman wrapper (never `fetch`), so the framed
request/response block and the error handling are identical to what the
frontend sees.

the bins are grouped by the api they talk to, mirroring the
middleman:

- `bin/intear/` — the intear api, called directly from the browser.
  the api is public and has no auth, so these bins need no base url.
- `bin/huggies/` — our own backend, through `middleman/huggies`.
- `bin/fun/` — bin primitives shared by the bins above.

bins accept positional args and `--flag value` pairs; when argv is
omitted, the defaults documented per bin below are used. all commands
are run from the project root.

## CONFIGURING THE BACKEND URL

every bin in `bin/huggies/` accepts `[--base-url <url>]` to point at a
backend other than the default `http://127.0.0.1:54733`. the flag wins
over the default for that single invocation; there is no env-var
fallback by design (every invocation must be explicit about which
backend it talks to). the URL is the only knob not baked into the bin,
since it changes between local dev and the docker-mounted box.

```sh
# defaults to http://127.0.0.1:54733
bun bin/huggies/api_huggies_ping_get.ts

# point at a different backend (staging / docker host / etc.)
bun bin/huggies/api_huggies_ping_get.ts --base-url http://my-host:54733
```

## HUGGIES BINS

these talk to our own backend through `middleman/huggies`. one bin per
route of ours, so a new route gets a new bin.

```sh
# GET /api/huggies/ping — liveness check. answers
# { "ok": true, "app": "huggies-rex-engine" }.
bun bin/huggies/api_huggies_ping_get.ts
bun bin/huggies/api_huggies_ping_get.ts --base-url http://my-host:54733

# GET /api/trezu/user/treasuries — the treasuries (sputnik daos) an
# account belongs to. the account id is required and is trimmed.
bun bin/huggies/api_trezu_treasuries_get.ts sleet.near

# hidden treasuries too — the flag stands alone, it takes no value.
bun bin/huggies/api_trezu_treasuries_get.ts sleet.near --include-hidden
```

## INTEAR BINS

these talk to the intear api through `middleman/intear`. **one bin per
one-shot endpoint — all 11 of them.** the api's websocket endpoints
(`*.subscribe`) are intentionally not covered, since `middleman/intear/`
is HTTP-only.

```sh
# GET /tokens — token rows. token ids are positional and optional;
# with no ids and a --sort you get the top tokens by that field.
# note: the api requires `sort` whenever `limit` is passed.
bun bin/intear/intear_tokens_get.ts wrap.near
bun bin/intear/intear_tokens_get.ts wrap.near,usdt.tether-token.near --fields symbol,price_usd

# top 20 by volume, filters applied via --where key=value
bun bin/intear/intear_tokens_get.ts --fields symbol,volume_usd_24h \
  --sort volume_usd_24h --desc --limit 20 \
  --where min_reputation=NotFake

# GET /tokens/search — fuzzy search by name/symbol. needs no --sort.
bun bin/intear/intear_tokens_search.ts wnear --limit 10
bun bin/intear/intear_tokens_search.ts '' --holder sleet.near

# GET /trades — every trade. a trade is a swap, so the useful columns
# are token_in/amount_in vs token_out/amount_out plus usd_value.
bun bin/intear/intear_trades_query.ts --limit 20
bun bin/intear/intear_trades_query.ts --token wrap.near --side buy --limit 10
bun bin/intear/intear_trades_query.ts --min-usd 10000 --limit 5 --order oldest

# GET /transfers — token transfers. REQUIRES an account/sender/receiver.
bun bin/intear/intear_transfers_query.ts sleet.near --limit 20
bun bin/intear/intear_transfers_query.ts sleet.near --sender sleet.near --kind mint

# GET /activity — trades AND transfers of one account in one merged
# feed. this is what the FEED page wants.
bun bin/intear/intear_activity_query.ts sleet.near --limit 20
bun bin/intear/intear_activity_query.ts sleet.near trade --limit 10
bun bin/intear/intear_activity_query.ts sleet.near trade,transfer --token wrap.near

# GET /candles — OHLCV series, up to 200 tokens per call.
# resolution defaults to 1h; quote is usd or near.
bun bin/intear/intear_candles_get.ts wrap.near
bun bin/intear/intear_candles_get.ts wrap.near,usdt.tether-token.near 1d --count-back 30
bun bin/intear/intear_candles_get.ts wrap.near 1h --quote near --series open,high,low,close

# GET /balances — one account's balances. sources defaults to all
# three (direct,native,rhea); pass a subset to narrow the request.
bun bin/intear/intear_balances_get.ts sleet.near
bun bin/intear/intear_balances_get.ts sleet.near direct
bun bin/intear/intear_balances_get.ts sleet.near direct --tokens wrap.near

# GET /holders — holders of one token, paginated. pass the cursor
# printed at the end of a run to fetch the next page.
bun bin/intear/intear_holders_get.ts wrap.near --limit 20
bun bin/intear/intear_holders_get.ts wrap.near --cursor 'account:balance'

# GET /positions — known positions of one account.
bun bin/intear/intear_positions_get.ts sleet.near --limit 50

# GET /prices/at — price of a token at a timestamp. the timestamp
# defaults to one hour ago (the "what was this worth" case); add
# extra queries with --also token@millis.
bun bin/intear/intear_prices_at_get.ts wrap.near
bun bin/intear/intear_prices_at_get.ts wrap.near 1767225600000
bun bin/intear/intear_prices_at_get.ts wrap.near \
  --also usdt.tether-token.near@1767225600000

# GET /accounts/search — accounts by id prefix, for an account picker.
bun bin/intear/intear_accounts_search.ts sleet --limit 20
```

## NOTES

- **`--fields` / `--series` are validated before the request.** the
  bins fetch the live schema and reject an unknown name with the valid
  list, so a typo fails locally instead of burning an API call.
- **`limit` requires `sort` on `/tokens`.** passing one without the
  other is a 400 from the server; the error block prints it in full.
- **`/transfers` needs a party.** an unfiltered history is unbounded,
  so the api rejects it; the account id is therefore a required
  positional.
- **`/activity` fields are per-kind.** one `--fields` string is fanned
  out across the requested kinds, because a kind with no field list
  returns no rows at all.
- **`account_id` is never a `--fields` value.** it is the row's
  leading column on every token endpoint and is always returned.
- **`prices/at` cannot query the future.** a timestamp newer than the
  indexer's latest block returns `not_indexed`, with the latest
  indexed height in the message.
- **every response carries a `height`.** that is the indexer block the
  data came from, so it is the version of the answer — two endpoints
  called a second apart can legitimately disagree.
- **a flag that takes no value is listed by its bin.** `split_argv`
  takes the boolean flags as an argument, so `--desc` in one bin never
  swallows a positional in another bin.

========================================
<br/>
copyright 2026 by sleet.near
