# ACCOUNT

profile/account page - ?id=

the account id comes from the `?id=` url parameter, NOT from auth —
any account renders for anyone. components read it through
`frontend/lib/ts/account_id.ts` and render nothing when there is no
`?id=`.

- `HUGGIES_COMPONENT_ACCOUNT_ID_H1` - <h1> of the account id, left
  aligned with a bottom border.
- `HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE` - the account's
  balances from intear, sources `direct` + `native`. `rhea` (LP
  positions) is not shown. one row per token, every field stacked in a
  single column (icon, ticker, balance, usd, then the full contract id
  clipped underneath) so the table never scrolls sideways. the native
  NEAR balance is pinned above the sorted list. sortable by ticker or
  usd, either direction, default usd descending. balances under the
  usd floor in `lib/ts/balance_filter.ts` are hidden and counted in a
  note below the table. `rhea` + `native` come from the SAME /balances
  request; there is no separate near-balance endpoint.

### TOKEN INFO

token metadata has one read-through path, used anywhere token info is
needed — never call the api for token fields directly.

- `frontend/lib/ts/token_info.ts` - `HUGGIES_TOKEN_INFO.get(ids)` returns
  a map of id -> info (symbol, decimals, icon, price_usd, reputation,
  holders).
- `frontend/lib/ts/token_cache.ts` - the durable half (symbol, decimals,
  icon) in an indexeddb `tokens` store, one entry per token id, never
  expires. price/reputation are deliberately NOT cached.

`token_info.ts` issues TWO `/tokens` requests, not one:

- durable fields (`symbol,decimals,icon`) only for ids not already in
  the cache — skipped entirely on a warm cache.
- volatile fields (`price_usd,reputation,holders`) for every id on
  every load, so usd values are never stale.

this split matters because `icon` is a full inline svg data uri: for
~100 tokens the two are ~341KB together but only ~10KB for the volatile
half. a cold load pays 341KB once; every revisit after is ~10KB.
- `frontend/lib/ts/token_amount_format.ts` - raw smallest-unit amounts ->
  human strings, and usd formatting.
- `frontend/lib/ts/balance_filter.ts` - spam + usd-floor policy.
- `frontend/lib/ts/balance_sort.ts` - ticker / usd ordering.

### RHEA DEPOSITS

`HUGGIES_COMPONENT_RHEA_DEPOSIT_TABLE` - the account's rhea (ref finance
v2) deposits, via `rhea_ammv2_get_deposits_fun_json` from
`@near-kit-tool-box/fun`, using `near_kit_client()`. these are DEPOSITS
(tokens held by rhea for the account), not LP positions. renders nothing
when there is no `?id=`, still loading, or no non-zero deposit — the view
returns keys for tokens the account touched once, mostly `"0"`, so key
count alone would show an empty section. rhea contract is
`v2.ref-finance.near` mainnet / `ref-finance-101.testnet` testnet.

metadata endpoint is intear `GET /tokens?ids=...&fields=...`. it takes up
to 2000 ids per request. `limit` requires a `sort`.

intear has NO `near` entry in /tokens (it comes back in `missing`), so
`token_info.ts` supplies NEAR itself: symbol NEAR, 24 decimals, a usd
price borrowed from wNEAR, which is 1:1 redeemable with NEAR, and
wNEAR's icon — which is the actual NEAR logo (the green `#00EC97` "N"),
not a lookalike. it also asks for `wrap.near` alongside whatever ids were
requested, so the price and icon cost no extra request. note NEAR has no
contract id of its own; the `near` balance is native, not an NEP-20 token.

=====================
<br/>
copyright 2026 by sleet.near