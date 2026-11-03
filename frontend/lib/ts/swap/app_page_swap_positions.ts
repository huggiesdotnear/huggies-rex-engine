// ========================================
// the swap page's positions: what the signed-in account holds from its
// intear dex trades, one position per token.
//
// the positions come from the SAME intear api the account page and the
// token page use, asked for the one account. the api answers with a
// row per token the account has ever traded, with the amount still
// held, what it cost and what it is worth.
//
// --- WHY THE SWAP PAGE HAS ITS OWN LOADER AND DOES NOT REUSE THE
// ACCOUNT PAGE'S: the account page loads FOUR balance tables for FOUR
// contracts because it shows all of them. the swap page needs the
// positions of the ONE account it is swapping with, so asking for the
// other contracts would be slow view calls for rows nobody sees.
import { api_intear_positions_get } from "@sleet-js/middleman-intear-api";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how many positions the page asks for.
//
// --- WHY --- the limit is generous: the api answers one row per token
// the account has ever traded, and a reader with more positions than
// this is rare. the rows are not sorted by the api, so the reader's
// biggest positions are not guaranteed to be in the first page — which
// is why the page sorts them itself once they land.
const HUGGIES_SWAP_POSITIONS_LIMIT = 50;
// ========================================
// ========================================
// --- TYPES ------------------------------
// one position: what the account holds of one token, and what it cost.
//
// --- WHY --- THE RAW AMOUNT IS KEPT AND NOT A DISPLAY STRING: the
// amount is what the reader SELLS when they tap the card, so it has to
// be exact and it has to be in the token's smallest unit. a display
// string would lose the last digits of a 24-decimal amount.
export interface HUGGIES_SWAP_POSITION {
  // the token's id.
  token: string;
  // the amount still held, in the token's smallest unit.
  amount: string;
  // the usd COST BASIS of what is still held.
  //
  // --- WHY --- THIS IS THE BASIS AND NOT THE CURRENT VALUE: on the
  // live rows, `cost_usd` is exactly `bought_usd × (1 − sold / bought)`
  // — the price paid for the part still held. the CURRENT value is
  // worked out from the token's price, so the card can show what the
  // position is worth now AND what it made.
  cost_usd: number;
  // the usd worth of everything that was bought.
  bought_usd: number;
  // the usd worth of everything that was sold.
  sold_usd: number;
  // the usd profit already banked from the sells.
  //
  // --- WHY --- ON THE LIVE ROWS THIS IS `sold_usd` MINUS THE BASIS OF
  // WHAT WAS SOLD: it matches to the last digit, so the api's own
  // realized profit is already the truth and is used as it is.
  realized_pnl_usd: number;
  // how many times it was bought.
  buys: number;
  // how many times it was sold.
  sells: number;
  // when it was opened, in millis.
  opened_at_millis: number | null;
  // when it was last traded, in millis.
  last_trade_millis: number;
  // is the position still open?
  //
  // --- WHY --- THIS IS FLAGGED AND NOT DERIVED FROM THE AMOUNT: a
  // closed position also carries an amount of zero, so the amount alone
  // cannot tell an open position that happens to be empty apart from a
  // closed one. the api says which it is.
  open: boolean;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// safe number parse: the api returns numbers for the usd fields, but a
// row with no value reports null rather than erroring.
function to_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// ========================================
// --- LOAD -------------------------------
// load the positions of one account.
//
// --- WHY THE ROWS ARE READ BY COLUMN NAME AND NOT BY INDEX: every
// other intear endpoint prepends `account_id` to its columns, so a
// fixed index read is off by one on those. the positions endpoint does
// not, but reading by name is right either way and needs no guess
// about which the api will do next time.
async function load_swap_positions_fun(
  account_id: string,
): Promise<ReadonlyArray<HUGGIES_SWAP_POSITION>> {
  const response = await api_intear_positions_get({
    account: account_id,
    limit: HUGGIES_SWAP_POSITIONS_LIMIT,
  });
  const positions: Array<HUGGIES_SWAP_POSITION> = [];
  for (const row of response.rows) {
    const amount = String(row[4]);
    // --- WHY A ZERO AMOUNT IS NOT A POSITION: the api keeps the row of
    // a token the account sold all of, and there is nothing to sell
    // twice. a card with no amount on it is a card the reader cannot
    // act on.
    if (amount === "0") continue;
    positions.push({
      token: String(row[0]),
      amount,
      cost_usd: to_number_fun(row[5]),
      bought_usd: to_number_fun(row[7]),
      sold_usd: to_number_fun(row[9]),
      realized_pnl_usd: to_number_fun(row[10]),
      buys: to_number_fun(row[11]),
      sells: to_number_fun(row[12]),
      opened_at_millis:
        typeof row[1] === "number" ? row[1] : null,
      last_trade_millis: to_number_fun(row[3]),
      open: row[2] === null,
    });
  }
  return positions;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_APP_PAGE_SWAP_POSITIONS = {
  load: load_swap_positions_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
