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
with the shared sort control (`lib/components/sort_control.tsx`), and the
direction can be flipped between **ASC** and **DESC** with the arrow button
next to the sort keys. price is not shown in the list — it belongs on the
token's own page.

### THE TOKEN SET

the list is the **whole indexed token set**, fetched in one call:

```
GET /tokens?fields=...&sort=-volume_usd_24h&limit=10000
```

the api answers with every token it knows (~7,400) and a `total` count.
one call, not a paginated walk — the whole set without icons is ~720KB.

> --- WHY --- the list used to be a truncated top-100 per sort field.
> that made two things impossible: an ascending sort showed the
> hundred *smallest* tokens of the top-100 (a wall of zero-volume test
> tokens), and a token outside that top-100 was unfindable however the
> reader typed. sorting now happens in javascript over the complete
> set, so every sort and every direction covers every token.

### TOKEN LIST CACHE

the token set is cached in IndexedDB database `huggies_token_list`, store
`tokens`, under the single key `all`. it holds the sortable fields
(name, symbol, decimals, price_usd, reputation, holders, volume_usd_24h,
market_cap_usd) for every token.

one snapshot, **not** one per sort field: sorting happens in javascript,
so a cached copy per sort would store the same 7,400 rows several times
over for nothing.

the cached set is served for **five minutes**; after that it is refetched
and replaced. the volume and market cap numbers in it move, so it cannot
be kept forever — but it must not be refetched on every visit either,
which is why it has a short ttl rather than being durable.

### TOKEN ICONS

icons are **not** fetched with the token set. the `icon` field is a full
base64 data uri per token, and asking for it on every indexed token
costs **~21MB** (against ~720KB for everything else).

instead, the icons of the tokens **actually on screen** are fetched in
batches of 60 (`lib/ts/token_icon_fetch.ts`) and written into the
durable per-token store (`huggies_tokens`, see below). a token's icon
never changes, so it is fetched once and read back from IndexedDB on
every later visit. visiting a token's own page warms that same store, so
the discover list and the token page share one cache.

### TOKEN SEARCH

the search box queries the **api**, not the downloaded list:

```
GET /tokens/search?q=<query>&fields=...&limit=100
```

> --- WHY --- the api has a real search index behind `/tokens/search`,
> matching symbol, name, account id and social links. filtering a
> downloaded list in javascript only ever sees the tokens we happened
> to download, so a token outside that set was unfindable however the
> reader typed. the api search has a hard `limit` of 100 rows.

the search is debounced by 250ms, so typing a word is one request rather
than one per letter.

### PINNED TOKENS

a short, deliberate list of tokens leads the discover list, whatever the
sort or direction (`lib/ts/pinned_tokens.ts`):

- `shit-1170.meme-cooking.near` — **our own token**, first
- the other meme-cooking tokens
- `token.0xshitzu.near`

> --- WHY --- the pinned block is a short explicit list with a stated
> reason per entry, not "every token some project happens to list". an
> earlier version pinned every token the emojifi project lists,
> including test tokens, and because the pinned block always won the
> comparison the list never actually followed the chosen sort — a pinned
> token with tiny volume sat above the biggest one, and no direction
> could fix it. now only this short list is pinned, and everything
> after it is sorted strictly.

our own token is `reputation: "Unknown"` in the api. that matters: a
`min_reputation=NotFake` filter on the list would **hide it entirely**
(only 87 tokens match that filter, and ours is not one of them).

## TOKEN LIST CACHE (per-token metadata)

the durable, never-expiring half of token metadata — symbol, decimals,
icon — lives in IndexedDB database `huggies_tokens`, store `tokens`, one
entry per token id, so any page or component can read metadata without
refetching. see `lib/ts/token_cache.ts` and `lib/ts/token_info.ts`.

this is the *other* half of the token storage, and the split is the
point:

| store | contents | lifetime |
|---|---|---|
| `huggies_token_list` / `tokens` | every token's sortable numbers | 5 minutes |
| `huggies_tokens` / `tokens` | every token's icon, symbol, decimals | forever |

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
