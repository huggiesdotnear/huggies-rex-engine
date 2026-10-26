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

each page has its OWN component and its OWN mount id, so there is no
shared contract page that switches on a contract key:

- `lib/components/contract_rhea_amm_page.tsx` — `HUGGIES_COMPONENT_CONTRACT_RHEA_AMM_PAGE`
- `lib/components/contract_rhea_dcl_v2_page.tsx` — `HUGGIES_COMPONENT_CONTRACT_RHEA_DCL_V2_PAGE`
- `lib/components/contract_intear_dex_page.tsx` — `HUGGIES_COMPONENT_CONTRACT_INTEAR_DEX_PAGE`
- `lib/components/contract_sputnik_dao_page.tsx` — `HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PAGE`
- `lib/components/contract_pumpopoly_page.tsx` — `HUGGIES_COMPONENT_CONTRACT_PUMPOPOLY_PAGE`

the shared chrome lives in `lib/components/contract_layout.tsx`: the page
wrapper, the signed-in account's balance panel, the data-limitations box
and the links to the other contracts.

`frontend/app/contract/contract.html` was removed — it was a single page
that switched on a `?id=` contract key, which is the shape this page set
moved away from.

## Contract keys

- `rhea-amm` — `v2.ref-finance.near`
- `rhea-dcl-v2` — `dclv2.ref-labs.near`
- `intear-dex` — `dex.intear.near`; live XYK sub-dex `slimedragon.near/xyk`
- `sputnik-dao` — Sputnik DAO selected by `dao_id` (default `sputnik-dao.near`)
- `pumpopoly` — `world.pumpopoly.near`

the keys are used by the discover cards (`lib/ts/contract_cards.ts`) to
link to the pages. they are not read by the pages themselves anymore.

## Dex pages

the three dex pages (Rhea AMM, Rhea DCL v2, INTEAR DEX) are placeholders
for now. each one shows its title as the h1, then `COMING SOON`, then
its contract id. the pool browser they used to share is gone — the pool
data it showed was wrong.

the per-dex data loaders (`lib/ts/rhea_amm_page.ts`,
`lib/ts/rhea_dcl_page.ts`, `lib/ts/intear_dex_page.ts`) stay, because the
account page still uses them to scan for LP positions.

the contract pages do not list LP positions. there is no clean way to ask a dex "every pool this account has a position in", so that per-pool scan lives only on the account page, where it is bounded and labeled.

the signed-in account's balances show on every contract page through the shared balance panel (`lib/components/balance_panel.tsx`), the same component the account page uses. the Pumpopoly page is the exception — it is about a player named in the url, so it shows that player's stats and no balance panel.

Sputnik members are derived from `get_policy` roles whose `kind` is `Group`; Sputnik does not expose `get_members`. The DAO page accepts a `dao_id` query parameter and offers a DAO id input and a dropdown of the signed-in account's Trezu treasuries. The optional Trezu treasury listing calls `GET /api/trezu/user/treasuries?accountId=<id>` and degrades gracefully when the proxy endpoint is unavailable.

> --- WHY --- the sputnik v2 contract has no internal-balance view, so
> the account's balance comes from INTEAR's direct balances instead of
> calling a contract method that does not exist.

## Pumpopoly

the Pumpopoly page reads a player from the `?id=` query parameter — the same shape as the token detail page — through an account id input and an `OPEN ACCOUNT` button. the id in the url is the player the page is about; the signed-in account is not used for the lookup.

the page order is: the `PUMPOPOLY` h1, then the account id selector, then the two contract sections. the selector sits under the h1 rather than above it, so the page opens with its name before its controls.

the page is split into two sections, one per contract it calls. each section's `h2` is the contract id it queries:

- **world.pumpopoly.near** — the `view_player` view. the in-game balance leads the section, full width above the cards, then six cards: land, board position, credit score, invites, invited by, and last move.
- **nft.pumpopoly.near** — the `nft_tokens_for_owner` view. the NFT count card and the token id list.

the h1 is `PUMPOPOLY`, all lowercase to match the site's heading style.

the page ends with a full-width `NEW PLAYERS START HERE` button linking to the Pumpopoly invite for `huggies.near`, the account this app signs players up through. it is not the player being viewed, there is no separate "INVITE LINK" text label, and it opens in a new tab.

the Pumpopoly token has **24 decimals**, so one unit is 1e24. the balance is shown in human units alongside the raw contract amount. credit score is `land_count * 10 + invites * 30`; the NFT count is not included in it.

=====================
<br/>
copyright 2026 by sleet.near
