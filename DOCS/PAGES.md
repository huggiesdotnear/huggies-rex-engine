# PAGES

pages and ui layout

nav

- index.html - FEED
- swap.html - SWAP
- account-router.html - PROFILE
- skill.html - SKILL

---

#### FEED - frontend/app/index.html

transaction feed

#### SWAP - frontend/app/swap.html

swap componenet

#### ACCOUNT - frontend/app/account.html

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
- `frontend/lib/ts/token_amount_format.ts` - raw smallest-unit amounts ->
  human strings, and usd formatting.
- `frontend/lib/ts/balance_filter.ts` - spam + usd-floor policy.
- `frontend/lib/ts/balance_sort.ts` - ticker / usd ordering.

metadata endpoint is intear `GET /tokens?ids=...&fields=...`. it takes up
to 2000 ids per request. `limit` requires a `sort`.

intear has NO `near` entry in /tokens (it comes back in `missing`), so
`token_info.ts` supplies NEAR itself: symbol NEAR, 24 decimals, a usd
price borrowed from wNEAR, which is 1:1 redeemable with NEAR, and
wNEAR's icon — which is the actual NEAR logo (the green `#00EC97` "N"),
not a lookalike. it also asks for `wrap.near` alongside whatever ids were
requested, so the price and icon cost no extra request. note NEAR has no
contract id of its own; the `near` balance is native, not an NEP-20 token.

#### SKILL - frontend/app/skill.html

skill info page

### AUTH - frontend/app/auth.html

auth login page, auto redirects to account page if logged in

=====================
<br/>
copyright 2026 by sleet.near
