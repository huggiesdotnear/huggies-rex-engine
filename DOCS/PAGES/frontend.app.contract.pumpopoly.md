# frontend/app/contract/pumpopoly.html

PUMPOPOLY

<!--
this file contains the source of truth for what is on the page.
do not add classes here as they are something not written in stone.
-->

```html
<main>
  <!--==========================================-->
  <h1>PUMPOPOLY</h1>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR"></div>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS"></div>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST"></div>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_INVITE"></div>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_CONTRACT_LINKS"></div>
  <!--==========================================-->
</main>
<nav id="HUGGIES_COMPONENT_NAV"></nav>
<div id="HUGGIES_COMPONENT_AUTH_BUTTON"></div>
```

## the account id

the page shows one player, taken from the `?id=` url parameter.

- `?id=` present — that player, always. a shared link to someone
  else's account stays viewable by a guest.
- `?id=` absent, signed in — the signed-in account.
- `?id=` absent, signed out — no player. the page does NOT redirect to
  the auth page; it shows the selector and nothing else.

the `?id=` is read through
[`frontend/lib/ts/page_account_id.ts`](../../frontend/lib/ts/page_account_id.ts),
the shared module every page reads it through.

## the components

| component                                               | what it shows                         |
| ------------------------------------------------------- | ------------------------------------- |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_ACCOUNT_SELECTOR` | the id jump box                       |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PLAYER_STATS`     | the balance and the six world cards   |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_NFT_LIST`         | the nft count and the token ids       |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_INVITE`           | the "new players start here" link     |
| `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_CONTRACT_LINKS`   | the links to the other contract pages |

## when a source fails

each source is caught on its own, so one contract being down leaves the
other one intact.

the component that shows a source's data owns that source's failure.
it renders an error card where the data would have been, so a reader is
never left looking at zeros and wondering whether the player has no
land or the contract could not be reached:

- the player call failed — the card says `COULD NOT LOAD / PLAYER DATA`
  above the world section.
- the nft call failed — the card says `COULD NOT LOAD / NFTS` above the
  nft section.

the errors are keyed by source in the loaded data, so a component can
tell which source a message belongs to.

## the requests

see [`frontend.app.contract.pumpopoly.requests.md`](./frontend.app.contract.pumpopoly.requests.md).

====================
<br/>
copyright 2026 by sleet.near
