# TOKEN

token detail page - `frontend/app/tokens/token.html?id=<token_id>`

the token id comes from the `?id=` query parameter. the page shows the
indexed token metadata (name, symbol, decimals, icon, price, reputation,
holders, liquidity, market cap, socials, description, and main pool when
available), indexed holders with cursor pagination, and pools that contain
the token across Rhea AMM, Rhea DCL, and INTEAR DEX/XYK. pool results are
explicitly scoped to the first 500 Rhea AMM pools, first 500 Rhea DCL pools,
and first 71 INTEAR DEX/XYK pools; pools outside those ranges are not shown.

## INDEXED HOLDERS

holders come from INTEAR `GET /holders` in pages of at most 100 rows.
the page labels the list as **INDEXED HOLDERS**, shows the API total, and
offers a load-more button while the response includes a next cursor.

## TOKEN DISCOVER

`frontend/app/discover.html` lists supported contracts and a searchable
token list. the initial list uses `GET /tokens` ordered by market cap;
search uses `GET /tokens/search` after a short debounce. stale responses
are ignored.

## POOL CACHE

pool data is cached in IndexedDB database `huggies_pools`. it has one
object store for each supported dex:

- `pools_rhea_amm`
- `pools_rhea_dcl`
- `pools_intear_xyk`

each entry is keyed by dex and pool id and stores the pool contract, its
token ids, and raw token amounts. each dex store also records its fetch
timestamp. a revisit reuses the cached dex pool collection for five
minutes, then refreshes it from the contract so pool data does not stay
permanently stale.

=====================
<br/>
copyright 2026 by sleet.near
