// ========================================
// the account page's ONE load: every fetch the page makes happens here.
//
// read this file to know what the page requests.
//
// WHY this exists
// --- the four balance tables used to fetch independently, each asking
// for token metadata on its own: four volatile /tokens calls for
// overlapping token sets.
//
// one loader fixes that. the four sources report their raw balances, the
// token ids are unioned, and the metadata is fetched ONCE.
//
// WHAT THE PAGE REQUESTS
//   1. GET /balances   direct + native, the intear api
//   2. near view      rhea amm  get_deposits
//   3. near view      rhea dcl  list_user_assets
//   4. near view      intear    registered_assets_of
//   5. GET /tokens     durable fields, only for tokens never seen
//                      before (skipped on a warm cache)
//   6. GET /tokens     volatile fields, once, for every token
//
// the four sources are four different contracts, so they cannot be
// merged. the token metadata CAN be merged, and is. each source is
// independent: one failing never hides the others.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
import {
  rhea_ammv2_contractid,
  rhea_ammv2_get_deposits_fun_json,
  rhea_dclv2_list_user_assets_fun_json,
  intear_dex_engine_registered_assets_of_fun_json,
  intear_dex_asset_token_id,
  intear_dex_engine_contractid,
} from "@near-kit-tool-box/fun";
import { api_intear_balances_get } from "@sleet-js/middleman-intear-api";
import { HUGGIES_TOKEN_INFO } from "./token_info";
import { HUGGIES_AMOUNT_FORMAT } from "./token_amount_format";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "./token_info";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// "direct" is what the account holds itself; "native" is the chain's
// own NEAR balance. both come from the SAME /balances request. "rhea"
// (LP positions) is deliberately left out.
const HUGGIES_BALANCE_SOURCES = ["direct", "native"] as const;
const HUGGIES_RHEA_DCL_CONTRACT_ID = "dclv2.ref-labs.near";
// --- WHY --- this app is mainnet-only, so the network is a literal
// here rather than a value read from somewhere.
function rhea_amm_contract_id_fun(): string {
  return rhea_ammv2_contractid("mainnet");
}
// ========================================
// ========================================
// --- TYPES ------------------------------
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
async function fetch_raw_intear_fun(
  account_id: string,
): Promise<HUGGIES_APP_PAGE_ACCOUNT_RAW> {
  try {
    const registered = await intear_dex_engine_registered_assets_of_fun_json(
      near_kit_client(),
      intear_dex_engine_contractid("mainnet"),
      account_id,
      null,
      0,
      500,
    );
    const balances = new Map<string, string>();
    for (const row of registered) {
      if (row.balance === "0") continue;
      balances.set(intear_dex_asset_token_id(row.asset_id), row.balance);
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
// the four sources run at the same time — they are four different
// contracts, so running them together makes the page as fast as its
// slowest source instead of the sum of all four.
//
// --- WHY --- the token metadata is fetched ONCE, after the sources
// answer. the union of every id the page touches goes in one call.
async function app_page_account_load_fun(
  account_id: string,
): Promise<HUGGIES_APP_PAGE_ACCOUNT_DATA> {
  const [direct, rhea_amm, rhea_dcl, intear] = await Promise.all([
    fetch_raw_direct_fun(account_id),
    fetch_raw_rhea_amm_fun(account_id),
    fetch_raw_rhea_dcl_fun(account_id),
    fetch_raw_intear_fun(account_id),
  ]);

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
