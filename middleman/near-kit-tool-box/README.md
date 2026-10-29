# NEAR_KIT_TOOL_BOX

💩 a LOCAL stand-in for `@near-kit-tool-box/fun`.

```
middleman/near-kit-tool-box/
├── fun/     one exported chain helper per file
├── types/   the typed response shapes those helpers return
├── stuff/   shared plumbing (borsh reader/writer, dex_view plumbing)
└── index.ts the barrel — everything the folder exports
```

## WHY THIS FOLDER EXISTS

the published [`@near-kit-tool-box/fun`](https://www.npmjs.com/package/@near-kit-tool-box/fun)
package (version `0.2.1`) does **not** ship the Rhea DCL v2 / INTEAR DEX
engine helpers yet. this repo needs them for the contract pages, so it
carries typed local versions of its own.

the folder lives under `middleman/` because it is a _client_ of the NEAR
chain, exactly like `middleman/intear/` and `middleman/huggies/` are
clients of their apis. it is re-exported from `middleman/index.ts`, so
frontend code imports it the same way it imports any other middleman
client.

## THE NAMES ARE DELIBERATE

the exported function names match the published package's names
one-for-one:

| this folder                                       | published package |
| ------------------------------------------------- | ----------------- |
| `rhea_ammv2_get_pool_shares_fun_json`             | same              |
| `rhea_ammv2_get_pool_shares_batch_fun_json`       | same              |
| `rhea_dclv2_list_user_assets_fun_json`            | same              |
| `intear_dex_engine_registered_assets_of_fun_json` | same              |
| `intear_dex_engine_dex_view_fun_json`             | same              |
| `intear_dex_xyk_get_pool_count_fun_json`          | same              |
| `intear_dex_xyk_get_pools_fun_json`               | same              |
| `intear_dex_xyk_get_pool_shares_fun_json`         | same              |
| `intear_dex_asset_id_fun`                         | same              |
| `intear_dex_asset_token_id_fun`                   | same              |

the call signatures match too: the `near` client is the **first**
argument, then the contract id, then the view args — the same shape the
published package uses:

```ts
// this repo, today:
import { rhea_dclv2_list_user_assets_fun_json } from "../../../middleman/near-kit-tool-box";

const assets = await rhea_dclv2_list_user_assets_fun_json(
  near_kit_client(),
  "dclv2.ref-labs.near",
  account_id,
);

// after the package ships the helper, delete this folder and:
import { rhea_dclv2_list_user_assets_fun_json } from "@near-kit-tool-box/fun";

// the call above does not change at all.
```

## WHEN THE PACKAGE PUBLISHES THE HELPERS

1. delete the whole `middleman/near-kit-tool-box/` folder
2. point the imports at `@near-kit-tool-box/fun` (one line per file)
3. drop the now-unused `near-kit` dependency if nothing else needs it

**no call site changes.** that is the whole point of mirroring the
names and the argument order.

## WHAT MOVED HERE

these files used to live scattered in `frontend/lib/ts/`:

| old path                                  | new home                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `contract_view.ts`                        | `fun/near_kit_contract_view_fun_json.ts`, `stuff/near_kit_contract_view.ts`                       |
| `rhea_amm_pool_shares.ts`                 | `fun/rhea_ammv2_get_pool_shares_fun_json.ts` + `fun/rhea_ammv2_get_pool_shares_batch_fun_json.ts` |
| `rhea_dcl_user_assets.ts`                 | `fun/rhea_dclv2_list_user_assets_fun_json.ts`                                                     |
| `intear_registered_assets.ts`             | `fun/intear_dex_engine_registered_assets_of_fun_json.ts`                                          |
| `intear_asset_id.ts`                      | `fun/intear_dex_asset_id_fun.ts`, `stuff/near_kit_intear_dex_asset_id.ts`                         |
| `intear_asset_token_id.ts`                | `fun/intear_dex_asset_token_id_fun.ts`                                                            |
| `intear_dex_view.ts`                      | `fun/intear_dex_engine_dex_view_fun_json.ts`, `stuff/near_kit_intear_dex_view.ts`                 |
| `intear_xyk_pool_count.ts`                | `fun/intear_dex_xyk_get_pool_count_fun_json.ts`                                                   |
| `intear_xyk_pool_shares.ts`               | `fun/intear_dex_xyk_get_pool_shares_fun_json.ts`                                                  |
| `borsh_reader.ts` + `intear_dex_borsh.ts` | `stuff/near_kit_borsh.ts` (one shared reader)                                                     |
| `intear_borsh.ts`                         | `stuff/near_kit_intear_dex_xyk_decode.ts`                                                         |

the two borsh readers that used to sit side by side (`borsh_reader.ts`
and `intear_dex_borsh.ts`) were near-duplicates of each other. they are
now **one** reader/writer pair in `stuff/near_kit_borsh.ts`.

the page-level loaders (`rhea_amm_page.ts`, `rhea_dcl_page.ts`,
`intear_dex_page.ts`, `pumpopoly_page.ts`, `sputnik_dao_page.ts`) stayed
in `frontend/lib/ts/` — they are ui data loaders, not chain helpers.
they import their chain calls from this folder.

## NO TESTS HERE

this repo has no test framework, and neither does the near-kit-tool-box
package this folder stands in for. the package verifies its helpers
against the live chain with real cli bins instead, so this folder
follows the same convention: the helpers are exercised by the pages
that use them.

## RULES

this folder follows `DOCS/RULES.md`:

- one function per file, `snake_case` names, file name matches the
  function name
- `========================================` section banners at the top and
  the bottom of every file
- no camelCase except for the `*_fun_json` suffix, which mirrors the
  published package's naming
