# CONTRACTS

smart-contract pages

## Routes

one html file per contract, all under `frontend/app/contract/`:

- `frontend/app/contract/rhea-amm.html` — Rhea AMM.
- `frontend/app/contract/rhea-dcl-v2.html` — Rhea DCL v2.
- `frontend/app/contract/intear-dex.html` — INTEAR DEX engine.
- `frontend/app/contract/sputnik-dao.html` — Sputnik DAO.
- `frontend/app/contract/pumpopoly.html` — Pumpopoly.

served at `/app/contract/<contract>.html`.

the page picks the contract from the `data-contract` attribute on the
mount element (`<div id="HUGGIES_COMPONENT_CONTRACT_PAGE"
data-contract="rhea-amm">`), not from a query string, so each file has a
plain, shareable url.

`frontend/app/contract/contract.html?id=<contract-key>` still works as a
legacy fallback: the component falls back to the `?id=` query when the
mount element has no `data-contract` attribute. no internal link points
at it any more.

`frontend/app/contract/discover.html` was removed — the contract cards
live on the main discover page (`frontend/app/discover.html`), and
nothing linked to the contracts-only page.

## Contract keys

- `rhea-amm` — `v2.ref-finance.near`
- `rhea-dcl-v2` — `dclv2.ref-labs.near`
- `intear-dex` — `dex.intear.near`; live XYK sub-dex `slimedragon.near/xyk`
- `sputnik-dao` — Sputnik DAO selected by `dao_id` (default `sputnik-dao.near`)
- `pumpopoly` — `world.pumpopoly.near`

Every page shows the contract's pools through one shared pool browser (`lib/components/pool_browser.tsx`): stat cards for **total pools** and **unique tokens**, a token search box, a token filter dropdown, and a pool card grid. The pool list is complete — every pool the dex holds, cached in IndexedDB — so the search is instant and nothing is hidden by a truncation.

Rhea AMM reports its pool count through `get_number_of_pools`; Rhea DCL has no count view, so its pages are walked until one comes back short; INTEAR DEX/XYK reports through `get_pool_count`.

the contract pages do not list LP positions. there is no clean way to ask a dex "every pool this account has a position in", so that per-pool scan lives only on the account page, where it is bounded and labeled.

the signed-in account's balances show on every contract page through the shared balance panel (`lib/components/balance_panel.tsx`), the same component the account page uses. the Pumpopoly page is the exception — it is about a player named in the url, so it shows that player's stats and no balance panel.

Sputnik members are derived from `get_policy` roles whose `kind` is `Group`; Sputnik does not expose `get_members`. The DAO page accepts a `dao_id` query parameter and offers a DAO id input and a dropdown of the signed-in account's Trezu treasuries. The optional Trezu treasury listing calls `GET /api/trezu/user/treasuries?accountId=<id>` and degrades gracefully when the proxy endpoint is unavailable.

> --- WHY --- the sputnik v2 contract has no internal-balance view, so
> the account's balance comes from INTEAR's direct balances instead of
> calling a contract method that does not exist.

## Pumpopoly

the Pumpopoly page reads a player from the `?id=` query parameter — the same shape as the token detail page — through an account id input and an `OPEN ACCOUNT` button. the id in the url is the player the page is about; the signed-in account is not used for the lookup.

the page is split into two sections, one per contract it calls. each section's `h2` is the contract id it queries:

- **world.pumpopoly.near** — the `view_player` view. the in-game balance leads the section, full width above the cards, then six cards: land, board position, credit score, invites, invited by, and last move.
- **nft.pumpopoly.near** — the `nft_tokens_for_owner` view. the NFT count card and the token id list.

the h1 is `PUMPOPOLY`, all lowercase to match the site's heading style.

the page ends with a full-width `NEW PLAYERS START HERE` button linking to the Pumpopoly invite for `huggies.near`, the account this app signs players up through. it is not the player being viewed, and there is no separate "INVITE LINK" text label.

the Pumpopoly token has **24 decimals**, so one unit is 1e24. the balance is shown in human units alongside the raw contract amount. credit score is `land_count * 10 + invites * 30`; the NFT count is not included in it.

=====================
<br/>
copyright 2026 by sleet.near
