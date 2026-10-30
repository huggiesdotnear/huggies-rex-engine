// ========================================
// the DAO page's balances: the dao's own token holdings.
//
// the read is the same one the account page makes — GET /balances
// with the direct and native sources — so the same look and the same
// token metadata apply.
//
// the loader is here rather than in the account page's loader because
// the two pages are separate: the account page shows an account and
// the dao page shows a dao, and each has its own store.
// ========================================
import { api_intear_balances_get } from "@sleet-js/middleman-intear-api";
import { HUGGIES_TOKEN_INFO } from "./token_info";
import { HUGGIES_AMOUNT_FORMAT } from "./token_amount_format";
import type { HUGGIES_TOKEN_INFO as TOKEN_INFO } from "./token_info";
// ========================================
// "direct" is what the dao holds itself; "native" is the chain's own
// NEAR balance, which intear reports as its own source. both come
// from the SAME /balances request.
const HUGGIES_DAO_BALANCE_SOURCES = ["direct", "native"] as const;
// ========================================
// --- TYPES ------------------------------
// one token holding.
export interface HUGGIES_DAO_BALANCE {
  id: string;
  raw: string;
  info: TOKEN_INFO;
  usd_value: number;
}
// ========================================
// the dao page's balances.
export interface HUGGIES_DAO_BALANCES {
  // the holdings, direct and native.
  rows: ReadonlyArray<HUGGIES_DAO_BALANCE>;
  // one message per thing that failed.
  errors: ReadonlyArray<string>;
}
// ========================================
// --- LOAD -------------------------------
// fetch the dao's balances and the token metadata for them.
async function load_dao_balances_fun(
  dao_id: string,
): Promise<HUGGIES_DAO_BALANCES> {
  const errors: Array<string> = [];
  let balances = new Map<string, string>();
  try {
    const response = await api_intear_balances_get({
      account: dao_id,
      sources: HUGGIES_DAO_BALANCE_SOURCES,
    });
    for (const row of response.balances.rows) {
      // a 0 balance means the dao merely touched the token once; it is
      // not a holding and must not reach the table.
      if (row[2] === "0") continue;
      balances.set(row[0], row[2]);
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  const info_map = await HUGGIES_TOKEN_INFO.get([...balances.keys()]);
  const rows: Array<HUGGIES_DAO_BALANCE> = [];
  for (const [id, raw] of balances) {
    const info = info_map.get(id);
    if (info === undefined) continue;
    rows.push({
      id,
      raw,
      info,
      usd_value: HUGGIES_AMOUNT_FORMAT.balance_usd(raw, info),
    });
  }
  return { rows, errors };
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_CONTRACT_SPUTNIK_DAO_BALANCES = {
  load: load_dao_balances_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
