# ACCOUNT

profile/account page - ?id=

the account id comes from the `?id=` url parameter, NOT from auth —
any account renders for anyone. components read it through
`frontend/lib/ts/account_id.ts` and render nothing when there is no
`?id=`.

### BARE PAGE ROUTING

`frontend/lib/ts/account_route.ts` — when `account.html` is opened with
NO `?id=`, it decides what to show: signed in → rewrites the url to
`account.html?id=<id>`, signed out → `auth.html`. this is what
`account-router.html` used to do, folded into the page itself.

loaded BEFORE `import.ts` so components never mount on a page that is
about to bounce. uses `location.replace`, so it stays out of history and
back doesn't land on the bare page again.

a real `?id=` always wins over auth — shared profile links stay
viewable by guests. it reads `?id=` off the url directly rather than via
`HUGGIES_ACCOUNT_ID`, because that module's state is populated by the
components which run after this decision.

- `HUGGIES_COMPONENT_ACCOUNT_ID_H1` - <h1> of the account id, left
  aligned with a bottom border.
- `HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE` - the account's
  balances from intear, sources `direct` + `native`. `rhea` (LP
  positions) is not shown. one row per token, every field stacked in a
  single column (icon, ticker, balance, usd, then the full contract id
  clipped underneath) so the table never scrolls sideways. contract ids
  link to the token detail page. the native
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
`v2.ref-finance.near` — this app is mainnet only (see
[`auth.md`](./auth.md)). deposit token contract ids link to the token
detail page.

metadata endpoint is intear `GET /tokens?ids=...&fields=...`. it takes up
to 2000 ids per request. `limit` requires a `sort`.

### DEX ACCOUNT SECTIONS

the account page has four independent DEX sections. each fetches, loads,
fails, and empties separately, so one unavailable contract never hides or
breaks the others.

- `HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE` - Rhea DCL v2
  internal balances from `dclv2.ref-labs.near` `list_user_assets`. the
  local helper in `frontend/lib/ts/rhea_dcl_user_assets.ts` checks the
  response is an object and keeps only string amounts. zero balances are
  omitted; token metadata and USD values use the shared token-info and
  amount-format paths.
- `HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_LP_TABLE` - Rhea AMM LP positions
  in `v2.ref-finance.near`. pools come from the installed toolbox's
  `rhea_ammv2_get_pools_fun_json`; account shares are fetched in batches of
  100 with `get_pool_shares_batch`. zero positions are omitted. the scope
  is explicitly labeled as the first 500 pools; positions outside that
  range are not shown. shares are shown as LP shares, never as token balances.
- `HUGGIES_COMPONENT_ACCOUNT_INTEAR_BALANCE_TABLE` - INTEAR DEX internal
  balances from `dex.intear.near` `registered_assets_of`. the local
  helper paginates 100 assets at a time and accepts only
  `[asset_id,balance]` tuple rows with string balances. `nep141` asset ids
  are converted to their token contract id for metadata; native `near`
  uses the existing NEAR metadata special case.
- `HUGGIES_COMPONENT_ACCOUNT_INTEAR_LP_TABLE` - INTEAR DEX XYK LP
  positions. the local Borsh helper calls engine `dex_view` with the
  base64-encoded `get_pool_shares` arguments and decodes
  `Vec<Option<u128>>`. the XYK pool count is read through the same
  `dex_view` path. zero and absent shares are omitted. the scope is
  explicitly labeled as the first 71 pools; positions outside that range
  are not shown.

the INTEAR XYK section currently shows pool id and shares only. the XYK
pool pair and USD value are not shown because this app's local decoder
does not safely expose the complete `PoolView` variants and reserves.
No USD value is invented.

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
