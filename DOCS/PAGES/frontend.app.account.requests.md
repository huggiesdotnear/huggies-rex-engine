# ACCOUNT PAGE REQUESTS

what the account page fetches, and where.

the answer to "what does this page request?" is
[`frontend/lib/ts/app_page_account.ts`](../../frontend/lib/ts/app_page_account.ts).
that file is the page's ONLY loader — every fetch the page makes
happens in it, and no component fetches anything.

read that file and you know the page's requests. this page is the
written-down version of the same thing.

## THE REQUESTS

| # | what | how |
|---|---|---|
| 1 | direct + native balances | `GET /balances?account=<id>&sources=direct,native` |
| 2 | rhea amm balances | near view `v2.ref-finance.near.get_deposits` |
| 3 | rhea dcl v2 balances | near view `dclv2.ref-labs.near.list_user_assets` |
| 4 | intear dex balances | near view `dex.intear.near.registered_assets_of` |
| 5 | token metadata, durable | `GET /tokens?fields=symbol,decimals,icon&ids=<new>` |
| 6 | token metadata, volatile | `GET /tokens?fields=price_usd,reputation,holders&ids=<all>` |

requests 1-4 are the four data sources. they are four different
contracts, so they are four requests — they cannot be merged. they run
**in parallel**, so the page is as slow as its slowest source, not the
sum of all four.

requests 5-6 are the token metadata for everything the four sources
returned. they are **one** call for the whole page, not one per table.

### request 5 is skipped on a warm cache

the durable fields (symbol, decimals, icon) never change for a token, so
they are cached in IndexedDB forever. request 5 only fires for tokens
the app has never seen. on a second visit it is usually skipped
entirely.

### request 6 always fires

prices and reputation move within minutes, so they are never cached.
one call for every token on the page, every load.

## THE FOUR TABLES

| table | component | source |
|---|---|---|
| direct + native | `HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE` | request 1 |
| rhea amm | `HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_BALANCE_TABLE` | request 2 |
| rhea dcl v2 | `HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE` | request 3 |
| intear dex | `HUGGIES_COMPONENT_ACCOUNT_INTEAR_BALANCE_TABLE` | request 4 |

the components read the loaded data from
[`frontend/lib/ts/app_page_account_store.ts`](../../frontend/lib/ts/app_page_account_store.ts)
and fetch nothing themselves.

## WHY IT WAS FOUR TIMES THE REQUESTS

each of the four tables used to fetch independently: it awaited its own
contract call, then asked for token metadata on its own. the page's
request count was the sum of four independent pipelines.

the visible cost was four volatile `/tokens` calls for token sets that
overlapped, and two of them were **byte-identical** — two tables wanted
`near` at the same time and neither knew about the other.

`near` made it worse. it has no row in the api's `/tokens` response —
it comes back in the `missing` list — so it could never be written to
the durable cache. it therefore looked uncached on *every* load, and
every caller that wanted it made its own durable request for it. it is
now cached explicitly, so it is treated as known after the first load.

## FAILING SOURCES

each source is caught on its own. a contract that is down leaves the
other three tables intact, and the message lands in `data.errors`.

## THE CHECK

[`frontend/lib/components/app_page_account.test.tsx`](../../frontend/lib/components/app_page_account.test.tsx)
drives the real loader and asserts the page makes one balances request,
at most one durable token request, exactly one volatile token request,
and no duplicate urls.

=====================
<br/>
copyright 2026 by sleet.near
