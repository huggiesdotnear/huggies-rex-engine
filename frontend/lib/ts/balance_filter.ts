// ========================================
// which tokens a balance table shows. two rules, both applied on the
// client after balances come back: intear's own `reputation` label, and
// a usd floor for the dust that reputation does not catch.
//
// the filter is shared by every page that shows token balances, so a
// dao and an account read the same way.
import type { HUGGIES_TOKEN_INFO } from "./token_info";
// ========================================
// --- CONFIG -----------------------------
// usd worth below which a holding is dust and is hidden regardless of
// reputation. $0.10 keeps a real position visible without letting the
// hundreds of near-worthless tokens a busy account holds swamp the
// table.
const HUGGIES_MIN_USD_BALANCE = 0.1;
// reputation values intear reports, worst first. only "Spam" is hidden
// outright; "Unknown" tokens still pass if they clear the usd floor,
// because a low-reputation token can still be worth holding.
const HUGGIES_SPAM_REPUTATION = "Spam";
// the chain's own token. never hidden: it is the balance an account is
// most likely to care about, and its usd price is derived rather than
// reported, so the floor below could hide a real holding.
const HUGGIES_NEAR_ID = "near";
// ========================================
// --- TYPES ------------------------------
// one row ready to render: the raw balance plus the info needed to
// show it.
export interface HUGGIES_BALANCE_ENTRY {
  id: string;
  raw: string;
  usd_value: number;
  info: HUGGIES_TOKEN_INFO;
}
// ========================================
// --- FILTER ----------------------------
// keep only entries worth showing: not spam, and above the usd floor.
// --- WHY --- spam is judged by the api's own reputation label, but the
// usd floor is applied to everything including Reputable tokens: live
// data shows Reputable tokens priced at 1e-8, so reputation alone would
// leave pure dust in the table.
//
// --- WHY --- spam is hidden even when the reader asks to see the dust.
// a spam token is a scam by the api's own reckoning; showing it as a
// holding a reader asked for would be showing them a liability they
// asked to see. the dust toggle is about worthlessness, not about
// scams.
function keep_entry_fun(entry: HUGGIES_BALANCE_ENTRY): boolean {
  if (entry.info.reputation === HUGGIES_SPAM_REPUTATION) return false;
  if (entry.id === HUGGIES_NEAR_ID) return true;
  return entry.usd_value >= HUGGIES_MIN_USD_BALANCE;
}
// ========================================
// apply the policy to a list of entries.
// `show_dust` is the reader's choice from the table's control: with it
// off the usd floor applies, with it on only the spam rule applies.
function filter_entries_fun(
  entries: ReadonlyArray<HUGGIES_BALANCE_ENTRY>,
  show_dust: boolean,
): ReadonlyArray<HUGGIES_BALANCE_ENTRY> {
  if (show_dust) {
    return entries.filter(
      (entry) => entry.info.reputation !== HUGGIES_SPAM_REPUTATION,
    );
  }
  return entries.filter(keep_entry_fun);
}
// ========================================
// how many entries the filter would hide, so the table can say so.
function hidden_count_fun(
  entries: ReadonlyArray<HUGGIES_BALANCE_ENTRY>,
  show_dust: boolean,
): number {
  return entries.length - filter_entries_fun(entries, show_dust).length;
}
// ========================================
// the filter policy in one object.
export const HUGGIES_BALANCE_FILTER = {
  filter: filter_entries_fun,
  hidden_count: hidden_count_fun,
  min_usd: HUGGIES_MIN_USD_BALANCE,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
