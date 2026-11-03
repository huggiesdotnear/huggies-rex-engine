// ========================================
// the swap page's balances: what the signed-in account holds of the
// two tokens the swap is between.
//
// the balances come from the SAME intear /balances endpoint the
// account page uses, asked for the one account and the two token ids.
//
// --- WHY THE SWAP PAGE HAS ITS OWN LOADER AND DOES NOT REUSE THE
// ACCOUNT PAGE'S: the account page loads FOUR balance tables for FOUR
// contracts (direct, rhea amm, rhea dcl, intear) because it shows all
// of them. the swap page needs the direct and native balances of two
// tokens and nothing else, so asking for the other two contracts would
// be two slow view calls for rows nobody sees.
import { api_intear_balances_get } from "@sleet-js/middleman-intear-api";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// "direct" is what the account holds itself; "native" is the chain's
// own NEAR balance. both come from the SAME /balances request.
const SHIT_1170_SWAP_BALANCE_SOURCES = ["direct", "native"] as const;
// ========================================
// ========================================
// --- TYPES ------------------------------
// the raw balance of one token, in its smallest unit.
export type SHIT_1170_SWAP_BALANCES = ReadonlyMap<string, string>;
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the raw balances of the given token ids for one account.
//
// --- WHY --- a token the account does not hold is absent from the map
// rather than present with a zero: a missing entry and a zero balance
// read the same to the reader, and the map stays smaller.
async function load_swap_balances_fun(
  account_id: string,
  token_ids: ReadonlyArray<string>,
): Promise<SHIT_1170_SWAP_BALANCES> {
  const unique = [...new Set(token_ids)];
  if (unique.length === 0) return new Map();
  const response = await api_intear_balances_get({
    account: account_id,
    sources: SHIT_1170_SWAP_BALANCE_SOURCES,
    tokens: unique,
  });
  const balances = new Map<string, string>();
  for (const row of response.balances.rows) {
    // a zero balance means the account merely touched the token once;
    // it is not a holding.
    if (row[2] === "0") continue;
    balances.set(row[0], row[2]);
  }
  return balances;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_SWAP_BALANCES = {
  load: load_swap_balances_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
