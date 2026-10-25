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
token list. the initial list uses `GET /tokens` ordered by market cap;
search uses `GET /tokens/search` after a short debounce. stale responses
are ignored.

### EMOJI SPOTLIGHT

above the general token list, discover shows an **EMOJI SPOTLIGHT**
section with the meme tokens from the emojifi project
(<https://gitlab.com/sleet-dev/sleet_vibe/emojifi>). the list is the
single source of truth in `lib/ts/emoji_tokens.ts` (`HUGGIES_EMOJI_TOKENS`),
which the emoji memory match game page also reads, so the game and the
spotlight always show the same memes.

| emoji | token                              |
| ----- | ---------------------------------- |
| 🐶    | `token.0xshitzu.near`              |
| 💩    | `shit-1170.meme-cooking.near`      |
| 🐲    | `blackdragon.tkn.near`             |
| 🦆    | `duct-1078.meme-cooking.near`      |
| 🗳️    | `vote-1737.meme-cooking.near`      |
| 🍂    | `nearvember-337.meme-cooking.near` |
| 🌸    | `poppy-0.meme-cooking-test.near`   |
| 🍳    | meme cooking (dao, no token)       |

the spotlight rows are fetched live from INTEAR `GET /tokens` with
`ids=[...]` (`lib/ts/emoji_spotlight_fetch.ts`), and each row shows the
emoji, the token icon, the symbol, the price and the holder count, linking
to the token's detail page. a token INTEAR does not know is left out
rather than shown with a zero price.

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

each entry is keyed by dex and pool id and stores the pool contract, its
token ids, and raw token amounts. each dex store also records its fetch
timestamp. a revisit reuses the cached dex pool collection for five
minutes, then refreshes it from the contract so pool data does not stay
permanently stale.

=====================
<br/>
copyright 2026 by sleet.near
