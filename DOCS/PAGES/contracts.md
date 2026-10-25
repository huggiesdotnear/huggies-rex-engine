# CONTRACTS

smart-contract pages

## Routes

- `frontend/app/contracts/discover.html` — contract discover links.
- `frontend/app/contracts/contract.html?id=<contract-key>` — shared smart-contract page.
- `frontend/app/contracts/contract.html?id=sputnik-dao&dao_id=<dao-account>` — Sputnik DAO page for a selected DAO. The DAO defaults to `huggies.sputnik-dao.near`.

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
