// ========================================
// load the signed-in account's balances for the Sputnik DAO page.
// ========================================
import { api_intear_balances_get } from "../../../middleman";
import { HUGGIES_TOKEN_INFO } from "./token_info";
// ========================================
export interface HUGGIES_DAO_BALANCE {
  token_id: string;
  amount: string;
  decimals: number;
}
// ========================================
// load the direct token balances the signed-in account holds.
// --- WHY --- the sputnik v2 contract exposes no internal-balance view,
// so the dao balance card reads the account's own direct balances from
// INTEAR instead of calling a contract method that does not exist.
export async function load_dao_account_balances_fun(
  _dao_id: string,
  account_id: string,
): Promise<HUGGIES_DAO_BALANCE[]> {
  const response = await api_intear_balances_get({
    account: account_id,
    sources: ["direct", "native"],
  });
  const nonzero = response.balances.rows.filter((row) => row[2] !== "0");
  const info_map = await HUGGIES_TOKEN_INFO.get(nonzero.map((row) => row[0]));
  const balances: HUGGIES_DAO_BALANCE[] = [];
  for (const row of nonzero) {
    const info = info_map.get(row[0]);
    balances.push({
      token_id: row[0],
      amount: row[2],
      decimals: info?.decimals ?? 0,
    });
  }
  return balances;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
