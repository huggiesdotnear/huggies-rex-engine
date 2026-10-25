# CONTRACTS

smart-contract pages

## Routes

one html file per contract, all under `frontend/app/contracts/`:

- `frontend/app/contracts/rhea-amm.html` — Rhea AMM.
- `frontend/app/contracts/rhea-dcl-v2.html` — Rhea DCL v2.
- `frontend/app/contracts/intear-dex.html` — INTEAR DEX engine.
- `frontend/app/contracts/sputnik-dao.html` — Sputnik DAO.
- `frontend/app/contracts/pumpopoly.html` — Pumpopoly.

served at `/app/contracts/<contract>.html`.

the page picks the contract from the `data-contract` attribute on the
mount element (`<div id="HUGGIES_COMPONENT_CONTRACT_PAGE"
data-contract="rhea-amm">`), not from a query string, so each file has a
plain, shareable url.

`frontend/app/contracts/contract.html?id=<contract-key>` still works as a
legacy fallback: the component falls back to the `?id=` query when the
mount element has no `data-contract` attribute. no internal link points
at it any more.

`frontend/app/contracts/discover.html` was removed — the contract cards
live on the main discover page (`frontend/app/discover.html`), and
nothing linked to the contracts-only page.

## Contract keys

- `rhea-amm` — `v2.ref-finance.near`
- `rhea-dcl-v2` — `dclv2.ref-labs.near`
- `intear-dex` — `dex.intear.near`; live XYK sub-dex `slimedragon.near/xyk`
- `sputnik-dao` — Sputnik DAO selected by `dao_id` (default `huggies.sputnik-dao.near`)
- `pumpopoly` — `world.pumpopoly.near`

Every page shows contract metadata, raw pool reserves grouped by DEX, the active signed-in account's internal balance, and that account's LP positions. Raw reserve units are shown because no reliable USD price is available from these contract views. Pool lists are bounded to the first 500 Rhea AMM pools, first 500 Rhea DCL pools, and first 71 INTEAR DEX/XYK pools; the page labels this scope instead of implying complete coverage.

Sputnik members are derived from `get_policy` roles whose `kind` is `Group`; Sputnik does not expose `get_members`. The optional Trezu treasury listing calls `GET /api/huggies/treasuries?accountId=<id>` and degrades gracefully when the proxy endpoint is unavailable.

Pumpopoly shows NFT count separately from the derived credit score. Credit score is `land_count * 10 + invites * 30`; NFT count is not included.

=====================
<br/>
copyright 2026 by sleet.near
