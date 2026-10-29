// ========================================
// the account page's ONE load: every fetch the page makes happens here.
//
// read this file to know what the account page requests. that is the
// whole point of it.
//
// WHY this exists
// --- the four balance tables used to fetch independently. each one
// awaited its own contract call and then asked for token metadata on
// its own, so the page's request count was the sum of four independent
// pipelines: four volatile /tokens calls for overlapping token sets,
// and two of them asking for the same thing at the same time.
//
// one loader fixes that. the four sources report their raw balances,
// the token ids are unioned, and the metadata is fetched ONCE for the
// whole page.
//
// WHAT THE PAGE REQUESTS
//   1. GET /balances              direct + native, the intear api
//   2. near view                 rhea amm   get_deposits
//   3. near view                 rhea dcl   list_user_assets
//   4. near view                 intear     registered_assets_of
//   5. GET /tokens                durable fields, only for tokens never
//                                 seen before (skipped on a warm cache)
//   6. GET /tokens                volatile fields, once, for every token
//
// the four data sources are four different contracts, so they are four
// requests — they cannot be merged. the token metadata CAN be merged,
// and is.
//
// each source is independent: one failing never hides the others.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  rhea_ammv2_contractid,
  rhea_ammv2_get_deposits_fun_json,
} from "@near-kit-tool-box/fun";
import {
  rhea_dclv2_list_user_assets_fun_json,
  intear_dex_engine_registered_assets_of_fun_json,
  intear_dex_asset_token_id_fun,
  NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
} from "../../../middleman/near-kit-tool-box";
import { api_intear_balances_get } from "../../../middleman";
import { HUGGIES_TOKEN_INFO } from "./token_info";
import { HUGGIES_AMOUNT_FORMAT } from "./token_amount_format";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "./token_info";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// "direct" is what the account holds itself; "native" is the chain's
// own NEAR balance, which intear reports as its own source. both come
// from the SAME /balances request — there is no separate endpoint for
// the NEAR balance. "rhea" (LP positions) is deliberately left out.
const HUGGIES_BALANCE_SOURCES = ["direct", "native"] as const;
// the rhea dcl v2 contract.
const HUGGIES_RHEA_DCL_CONTRACT_ID = "dclv2.ref-labs.near";
// the rhea amm contract for this app's network.
// --- WHY --- this app is mainnet-only, so the network is a literal
// here rather than a value read from somewhere.
function rhea_amm_contract_id_fun(): string {
  return rhea_ammv2_contractid("mainnet");
}
// ========================================
// ========================================
// --- TYPES ------------------------------
// one token holding in one of the tables.
export interface HUGGIES_APP_PAGE_ACCOUNT_BALANCE {
  id: string;
  raw: string;
  info: TOKEN_INFO;
  usd_value: number;
}
// ========================================
// the four tables the account page shows.
export interface HUGGIES_APP_PAGE_ACCOUNT_DATA {
  // direct + native balances from the intear api. the native NEAR row
  // is pinned into this one.
  direct: ReadonlyArray<HUGGIES_APP_PAGE_ACCOUNT_BALANCE>;
  // rhea amm (ref finance v2) balances held for the account.
  rhea_amm: ReadonlyArray<HUGGIES_APP_PAGE_ACCOUNT_BALANCE>;
  // rhea dcl v2 internal balances.
  rhea_dcl: ReadonlyArray<HUGGIES_APP_PAGE_ACCOUNT_BALANCE>;
  // intear dex internal balances.
  intear: ReadonlyArray<HUGGIES_APP_PAGE_ACCOUNT_BALANCE>;
  // one message per source that failed. a failed source is empty, and
  // the others still show.
  errors: ReadonlyArray<string>;
}
// ========================================
// --- RAW RESULT ------------------------
// one source's raw balances, before any token metadata is attached.
interface HUGGIES_APP_PAGE_ACCOUNT_RAW {
  balances: Map<string, string>;
  error: string | null;
}
// ========================================
// ========================================
// --- SOURCES ----------------------------
// the four raw sources. each one returns balances only — no metadata.
// the metadata is fetched once for the whole page, below.
//
// each source is caught on its own so one broken contract leaves the
// other three tables intact.
async function fetch_raw_direct_fun(
  account_id: string,
): Promise<HUGGIES_APP_PAGE_ACCOUNT_RAW> {
  try {
    const response = await api_intear_balances_get({
      account: account_id,
      sources: HUGGIES_BALANCE_SOURCES,
    });
    const balances = new Map<string, string>();
    for (const row of response.balances.rows) {
      // a 0 balance means the account merely touched the token once; it
      // is not a holding and must not reach the table.
      if (row[2] === "0") continue;
      balances.set(row[0], row[2]);
    }
    return { balances, error: null };
  } catch (err) {
    return {
      balances: new Map(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
// ========================================
// the rhea amm (ref finance v2) balances held for the account.
async function fetch_raw_rhea_amm_fun(
  account_id: string,
): Promise<HUGGIES_APP_PAGE_ACCOUNT_RAW> {
  try {
    const deposits = await rhea_ammv2_get_deposits_fun_json(
      near_kit_client(),
      rhea_amm_contract_id_fun(),
      account_id,
    );
    const balances = new Map<string, string>();
    for (const [id, raw] of Object.entries(deposits)) {
      if (raw === "0") continue;
      balances.set(id, raw);
    }
    return { balances, error: null };
  } catch (err) {
    return {
      balances: new Map(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
// ========================================
// the rhea dcl v2 internal balances.
async function fetch_raw_rhea_dcl_fun(
  account_id: string,
): Promise<HUGGIES_APP_PAGE_ACCOUNT_RAW> {
  try {
    const assets = await rhea_dclv2_list_user_assets_fun_json(
      near_kit_client(),
      HUGGIES_RHEA_DCL_CONTRACT_ID,
      account_id,
    );
    const balances = new Map<string, string>();
    for (const [id, raw] of Object.entries(assets)) {
      if (raw === "0") continue;
      balances.set(id, raw);
    }
    return { balances, error: null };
  } catch (err) {
    return {
      balances: new Map(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
// ========================================
// the intear dex internal balances.
async function fetch_raw_intear_fun(
  account_id: string,
): Promise<HUGGIES_APP_PAGE_ACCOUNT_RAW> {
  try {
    const registered = await intear_dex_engine_registered_assets_of_fun_json(
      near_kit_client(),
      NEAR_KIT_INTEAR_DEX_ENGINE_CONTRACT_ID,
      account_id,
      null,
      0,
      500,
    );
    const balances = new Map<string, string>();
    for (const row of registered) {
      if (row.balance === "0") continue;
      balances.set(intear_dex_asset_token_id_fun(row.asset_id), row.balance);
    }
    return { balances, error: null };
  } catch (err) {
    return {
      balances: new Map(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// fetch everything the account page shows.
//
// the four sources run at the same time — they are four different
// contracts, so running them together makes the page as fast as its
// slowest source instead of the sum of all four.
//
// --- WHY --- the token metadata is fetched ONCE, after the sources
// answer. each source used to ask for its own metadata, so the page
// made four volatile /tokens calls for token sets that overlapped.
// the union of every id the page touches is fetched in one call, and
// every source is answered from that one map.
async function app_page_account_load_fun(
  account_id: string,
): Promise<HUGGIES_APP_PAGE_ACCOUNT_DATA> {
  const [direct, rhea_amm, rhea_dcl, intear] = await Promise.all([
    fetch_raw_direct_fun(account_id),
    fetch_raw_rhea_amm_fun(account_id),
    fetch_raw_rhea_dcl_fun(account_id),
    fetch_raw_intear_fun(account_id),
  ]);

  // the union of every token id the page touches.
  const all_ids = new Set<string>();
  for (const source of [direct, rhea_amm, rhea_dcl, intear]) {
    for (const id of source.balances.keys()) all_ids.add(id);
  }
  const info_map = await HUGGIES_TOKEN_INFO.get([...all_ids]);

  // attach the metadata and work out each row's usd value.
  const build = (
    source: HUGGIES_APP_PAGE_ACCOUNT_RAW,
  ): Array<HUGGIES_APP_PAGE_ACCOUNT_BALANCE> => {
    const out: Array<HUGGIES_APP_PAGE_ACCOUNT_BALANCE> = [];
    for (const [id, raw] of source.balances) {
      const info = info_map.get(id);
      if (info === undefined) continue;
      out.push({
        id,
        raw,
        info,
        usd_value: HUGGIES_AMOUNT_FORMAT.balance_usd(raw, info),
      });
    }
    return out;
  };

  const errors: Array<string> = [];
  const labels = ["direct", "rhea amm", "rhea dcl", "intear"];
  const sources = [direct, rhea_amm, rhea_dcl, intear];
  for (let index = 0; index < sources.length; index += 1) {
    const error = sources[index].error;
    if (error !== null) errors.push(`${labels[index]}: ${error}`);
  }

  return {
    direct: build(direct),
    rhea_amm: build(rhea_amm),
    rhea_dcl: build(rhea_dcl),
    intear: build(intear),
    errors,
  };
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_ACCOUNT = {
  load: app_page_account_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
