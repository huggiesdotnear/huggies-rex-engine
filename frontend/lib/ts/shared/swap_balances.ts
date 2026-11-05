// ========================================
// the balances of the tokens a swap trades.
//
// the balances come from the SAME intear /balances endpoint the account
// page uses, asked for the one account and the token ids.
//
// --- WHY IT IS SHARED AND NOT IN THE SWAP PAGE'S FOLDER: the swap page
// needs the balances of the TWO tokens it trades, and the feed needs
// the balances of the token every queued swap sells. both are the same
// question — "does this account hold enough of this token?" — and they
// must not drift on how it is asked.
//
// --- WHY ONLY THE DIRECT AND NATIVE SOURCES: the account page loads
// FOUR balance tables for FOUR contracts (direct, rhea amm, rhea dcl,
// intear) because it shows all of them. a swap needs what the account
// holds itself, and the other two contracts would be two slow view
// calls for rows nobody sees.
import { api_intear_balances_get } from "@sleet-js/middleman-intear-api";
// ========================================
// --- CONFIG -----------------------------
// "direct" is what the account holds itself; "native" is the chain's
// own NEAR balance. both come from the SAME /balances request.
const SHIT_1170_SWAP_BALANCE_SOURCES = ["direct", "native"] as const;
// ========================================
// --- TYPES ------------------------------
// the raw balance of one token, in its smallest unit.
export type SHIT_1170_SWAP_BALANCES = ReadonlyMap<string, string>;
// ========================================
// --- LOAD -------------------------------
// load the raw balances of the given token ids for one account.
//
// --- WHY --- a token the account does not hold is absent from the map
// rather than present with a zero: a missing entry and a zero balance
// read the same to the reader, and the map stays smaller.
//
// --- WHY --- THE IDS ARE DEDUPED: the feed holds many swaps and two of
// them can sell the same token, and the endpoint takes a list.
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
// --- PUBLIC ---------------------------
export const SHIT_1170_SWAP_BALANCES = {
  load: load_swap_balances_fun,
};
// ========================================
// copyright 2026 by sleet.near
