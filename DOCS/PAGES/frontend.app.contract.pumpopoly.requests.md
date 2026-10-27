# PUMPOPOLY PAGE REQUESTS

what the Pumpopoly page fetches, and where.

the answer to "what does this page request?" is
[`frontend/lib/ts/contract_page_pumpopoly.ts`](../../frontend/lib/ts/contract_page_pumpopoly.ts).
that file is the page's ONLY loader — every fetch the page makes
happens in it, and no component fetches anything.

read that file and you know the page's requests. this page is the
written-down version of the same thing.

## THE REQUESTS

| #   | what              | how                                                 |
| --- | ----------------- | --------------------------------------------------- |
| 1   | the player        | near view `world.pumpopoly.near.view_player`        |
| 2   | the player's nfts | near view `nft.pumpopoly.near.nft_tokens_for_owner` |

requests 1-2 are two different contracts, so they are two requests —
they cannot be merged. they run **in parallel**, so the page is as slow
as its slowest source, not the sum of both.

neither request happens when there is no account id. a signed-out
visitor with no `?id=` sees the selector and no data, so the page
makes nothing.

## THE COMPONENTS

| component                                               | source                                 |
| ------------------------------------------------------- | -------------------------------------- |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR` | none — it writes the url               |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS`     | request 1                              |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST`         | request 2                              |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_INVITE`           | none — the link is a constant          |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_CONTRACT_LINKS`   | none — the contract list is a constant |

the components read the loaded data from
[`frontend/lib/ts/contract_page_pumpopoly_store.ts`](../../frontend/lib/ts/contract_page_pumpopoly_store.ts)
and fetch nothing themselves.

## FAILING SOURCES

each source is caught on its own. a contract that is down leaves the
other one intact.

the errors are keyed by source — `errors.player` and `errors.nfts` —
so the component that shows a source's data can tell which source a
message belongs to, and shows it where that data would have been.

====================
<br/>
copyright 2026 by sleet.near
