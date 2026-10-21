# bin

cli bins for talking to the intear api through `middleman/intear`.
every bin imports the middleman wrapper (never `fetch`), so the
framed request/response block and the error handling are identical to
what the frontend sees.

bins accept positional args and `--flag value` pairs; when argv is
omitted, the defaults documented per bin below are used. all commands
are run from the project root.

## BINS

```sh
# GET /tokens — token rows. token ids are positional and optional;
# with no ids and a --sort you get the top tokens by that field.
# note: the api requires `sort` whenever `limit` is passed.
bun bin/intear_tokens_get.ts wrap.near
bun bin/intear_tokens_get.ts wrap.near,usdt.tether-token.near --fields symbol,price_usd

# top 20 by volume, filters applied via --where key=value
bun bin/intear_tokens_get.ts --fields symbol,volume_usd_24h \
  --sort volume_usd_24h --desc --limit 20 \
  --where min_reputation=NotFake

# GET /candles — OHLCV series, up to 200 tokens per call.
# resolution defaults to 1h; quote is usd or near.
bun bin/intear_candles_get.ts wrap.near
bun bin/intear_candles_get.ts wrap.near,usdt.tether-token.near 1d --count-back 30
bun bin/intear_candles_get.ts wrap.near 1h --quote near --series open,high,low,close

# GET /balances — one account's balances. sources defaults to all
# three (direct,native,rhea); pass a subset to narrow the request.
bun bin/intear_balances_get.ts sleet.near
bun bin/intear_balances_get.ts sleet.near direct
bun bin/intear_balances_get.ts sleet.near direct --tokens wrap.near

# GET /holders — holders of one token, paginated. pass the cursor
# printed at the end of a run to fetch the next page.
bun bin/intear_holders_get.ts wrap.near --limit 20
bun bin/intear_holders_get.ts wrap.near --cursor 'account:balance'

# GET /positions — known positions of one account.
bun bin/intear_positions_get.ts sleet.near --limit 50

# GET /prices/at — price of a token at a timestamp. the timestamp
# defaults to one hour ago (the "what was this worth" case); add
# extra queries with --also token@millis.
bun bin/intear_prices_at_get.ts wrap.near
bun bin/intear_prices_at_get.ts wrap.near 1767225600000
bun bin/intear_prices_at_get.ts wrap.near \
  --also usdt.tether-token.near@1767225600000
```

## NOTES

- **`--fields` / `--series` are validated before the request.** the
  bins fetch the live schema and reject an unknown name with the valid
  list, so a typo fails locally instead of burning an API call.
- **`limit` requires `sort` on `/tokens`.** passing one without the
  other is a 400 from the server; the error block prints it in full.
- **`prices/at` cannot query the future.** a timestamp newer than the
  indexer's latest block returns `not_indexed`, with the latest
  indexed height in the message.
- **one-shot only.** there is no websocket bin, because
  `middleman/intear/` is HTTP-only by design (see `DOCS/FILES.md`).

========================================
<br/>
copyright 2026 by sleet.near
