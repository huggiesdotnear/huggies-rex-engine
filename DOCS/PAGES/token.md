# TOKEN

token detail page - `frontend/app/tokens/token.html?id=<token_id>`

the token id comes from the `?id=` query parameter. the page shows the
indexed token metadata (name, symbol, decimals, icon, price, reputation,
holders, liquidity, market cap, socials, description, and main pool when
available), indexed holders with cursor pagination, and pools that contain
the token across Rhea AMM, Rhea DCL, and INTEAR DEX/XYK.

the pool list is complete: the pool cache holds every pool each dex has,
so a token's pools are found across the whole collection rather than a
truncated first page. prices use `lib/ts/token_price_format.ts`, which
grows the decimal count as a price gets smaller, so a token priced at
0.00000012 does not read as a bare zero.

the token id box at the top of the page is pre-filled with the token the
page is showing and opens any other token when submitted.

## INDEXED HOLDERS

holders come from INTEAR `GET /holders` in pages of at most 100 rows.
the page labels the list as **INDEXED HOLDERS**, shows the API total, and
offers a load-more button while the response includes a next cursor.

each holder row shows the rank, the account id (linking to the account
page), and the same three token amounts the account balance rows show:

- **UNITS** — the raw on-chain integer in the token's smallest unit
- **BALANCE** — the human decimal amount, `raw / 10**decimals`
- **USD** — the human amount multiplied by the token's usd price

all three come from one shared formatter (`lib/ts/token_amount_display.ts`),
so the holders table and the account balance tables cannot drift apart.

## TOKEN AMOUNT DISPLAY

every place that shows a token amount goes through
`lib/ts/token_amount_display.ts`, which returns the three-part record
(`unit`, `decimal`, `usd`):

- `unit` — the raw smallest-unit integer, thousands-separated
  (`lib/ts/token_amount_unit.ts`)
- `decimal` — `HUGGIES_AMOUNT_FORMAT.balance`, the human-readable amount
- `usd` — `HUGGIES_AMOUNT_FORMAT.usd` of `HUGGIES_AMOUNT_FORMAT.balance_usd`

the account balance rows use it too: the decimal amount and the usd value
sit on the row head as before, and the raw unit amount is printed
underneath them.

## TOKEN DISCOVER

`frontend/app/discover.html` lists supported contracts and a searchable
token list. the list can be sorted by **24-hour volume** or **market cap**
with the shared sort control (`lib/components/sort_control.tsx`); the
initial list uses `GET /tokens` in the chosen order. price is not shown in
the list — it belongs on the token's own page.

the fetched list is cached in IndexedDB (`lib/ts/token_list_cache.ts`), one
entry per sort order. a revisit shows the cached list instantly, and the
search box filters that cached copy locally rather than asking the api on
every keystroke.

## TOKEN LIST CACHE

the token list lives in IndexedDB database `huggies_token_list`, store
`lists`, keyed by the sort order it was fetched in. each entry holds the
sort, the fetch time, and the full token rows. a cached list is served for
one minute; after that the list is refetched and the cache replaced.

the meme tokens from the emojifi project
(<https://gitlab.com/sleet-dev/sleet_vibe/emojifi>) are part of that one
token list. their ids come from `lib/ts/emoji_tokens.ts`, the same list
the memory game reads. `lib/ts/token_discover_order.ts` pins those tokens
to the top of the list and orders every other token by 24-hour volume.
there is no separate spotlight section and no emoji column.

### TOKEN ICONS

token icons are `data:image/webp;base64,...` URIs returned by INTEAR in
the `icon` field. they are requested on both the initial list path and
the search path.

> --- WHY --- an INTEAR token row always starts with an `account_id`
> column, even when `account_id` was not among the requested fields.
> reading a row by a fixed column index is therefore off by one, which
> put the price in the icon slot (a number, so the icon was dropped) and
> the token id in the name slot. rows are read by column NAME instead —
> see `lib/ts/token_row_by_name.ts`.

## POOL CACHE

pool data is cached in IndexedDB database `huggies_pools`. it has one
object store for each supported dex:

- `pools_rhea_amm`
- `pools_rhea_dcl`
- `pools_intear_xyk`

each store holds that dex's **complete** pool collection, plus the pool
count the contract reported and the number of pools actually cached. a
collection is served straight from the cache when it is complete and less
than five minutes old; a stale collection is still served immediately
while a fresh copy is fetched in the background, so a search never waits
on the chain.

> --- WHY --- the cache holds every pool, not a first page. a token's
> pool list and a pool search both run over the whole collection, so a
> truncated cache would silently hide pools.

## DEX POOL COUNTS

the dex pages show the number of pools each dex actually holds:

- Rhea AMM — `get_number_of_pools` (about 8991 on mainnet)
- Rhea DCL — no count view exists, so the pages are walked until one
  comes back short (about 6087 on mainnet)
- INTEAR DEX / XYK — `get_pool_count` (302 on mainnet)

Rhea AMM pages 2000 pools per call, Rhea DCL 500, and INTEAR 50 — a bigger
INTEAR page runs the sub-dex out of gas.

=====================
<br/>
copyright 2026 by sleet.near
