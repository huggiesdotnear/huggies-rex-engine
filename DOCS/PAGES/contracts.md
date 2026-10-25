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

Every page shows contract metadata and raw pool reserves. Raw reserve units are shown because no reliable USD price is available from these contract views. Pool lists are bounded to the first 500 Rhea AMM pools, first 500 Rhea DCL pools, and first 71 INTEAR DEX/XYK pools; the page labels this scope instead of implying complete coverage.

the three dex pages share one pool browser: total pools and unique tokens are shown as stat cards, and pools can be searched by token account id or narrowed with the token filter. Rhea AMM reports the contract's real pool count through `get_number_of_pools`; the other two report the number of pools they loaded.

the contract pages do not list LP positions. there is no clean way to ask a dex "every pool this account has a position in", so that per-pool scan lives only on the account page, where it is bounded and labeled.

Sputnik members are derived from `get_policy` roles whose `kind` is `Group`; Sputnik does not expose `get_members`. The DAO page accepts a `dao_id` query parameter, offers a DAO id input and a dropdown of the signed-in account's Trezu treasuries, and shows that account's balance. The optional Trezu treasury listing calls `GET /api/huggies/treasuries?accountId=<id>` and degrades gracefully when the proxy endpoint is unavailable.

> --- WHY --- the sputnik v2 contract has no internal-balance view, so
> the dao balance card reads the signed-in account's direct balances from
> INTEAR instead of calling a contract method that does not exist.

Pumpopoly shows NFT count separately from the derived credit score. Credit score is `land_count * 10 + invites * 30`; NFT count is not included. The in-game balance is displayed in human Pumpopoly units alongside the raw contract amount.

=====================
<br/>
copyright 2026 by sleet.near
