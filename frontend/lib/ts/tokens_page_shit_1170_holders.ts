// ========================================
// INTEAR all-holders fetch and display formatting for the SHIT page.
// ========================================
import { api_intear_holders_get } from "../../../middleman";
import { HUGGIES_SHIT_TOKEN_ID } from "./shit_token";
import {
  HUGGIES_SHIT_HOLDER_TYPE_REGULAR,
  shit_holder_type_fun,
  type HUGGIES_SHIT_HOLDER_ROW_TYPE,
} from "./tokens_page_shit_1170_known_holders";
// ========================================
// the type of a holder row, after known-holder classification.
export type HUGGIES_SHIT_HOLDER_TYPE = HUGGIES_SHIT_HOLDER_ROW_TYPE;
// ========================================
// one holder row, ready for display.
export interface HUGGIES_SHIT_HOLDER {
  account_id: string;
  // the raw balance, in the token's smallest unit (18 decimals).
  balance: string;
  // the human-readable amount.
  amount: number;
  // the amount, formatted for display.
  amount_formatted: string;
  // the usd worth of the holding.
  usd_value: number;
  // the usd worth, formatted for display.
  usd_formatted: string;
  // the share of the total supply, as a percentage number.
  percent: number;
  // the share of the total supply, formatted for display.
  percent_formatted: string;
  // dev | dex | vault | nft | burn | regular
  type: HUGGIES_SHIT_HOLDER_TYPE;
}
// ========================================
// one page of holders.
export interface HUGGIES_SHIT_HOLDERS_PAGE {
  rows: HUGGIES_SHIT_HOLDER[];
  total: number;
  next_cursor: string | null;
}
// ========================================
// how many holders the INTEAR holders endpoint returns per page.
export const HUGGIES_SHIT_HOLDERS_PAGE_SIZE = 100;
// ========================================
// --- HELPERS ----------------------------
// scale a raw token amount down by its decimals.
function raw_to_human_fun(raw: string, decimals: number): number {
  const scaled = Number(raw);
  if (!Number.isFinite(scaled)) return 0;
  return scaled / 10 ** decimals;
}
// ========================================
// format a token amount the way the SHIT info page does: big amounts
// get a K/M/B suffix, small ones keep two decimals.
function format_amount_fun(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}
// ========================================
// format a usd value: big amounts get a K/M suffix, tiny ones keep
// four decimals so a real price never renders as "$0.00".
function format_usd_fun(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (abs >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}
// ========================================
// format the share of the total supply: two decimals above 0.01%,
// three above 0.001%, and "<0.001%" for the dust below that.
function format_percent_fun(percent: number): string {
  if (percent >= 0.01) return `${percent.toFixed(2)}%`;
  if (percent >= 0.001) return `${percent.toFixed(3)}%`;
  return "<0.001%";
}
// ========================================
// the share of the total supply a raw balance holds, in percent.
function balance_percent_fun(balance: string, total_supply_raw: bigint): number {
  // --- WHY --- the raw balance and the raw supply are both 18-decimal
  // integers, so the ratio is computed on BigInt and only then scaled
  // to a percent. doing it in floating point loses the sub-0.001%
  // rows this page still has to rank.
  let raw = 0n;
  try {
    raw = BigInt(balance);
  } catch {
    raw = 0n;
  }
  if (total_supply_raw <= 0n) return 0;
  const scaled = (raw * 10_000n) / total_supply_raw;
  return Number(scaled) / 100;
}
// ========================================
// --- PUBLIC -----------------------------
// fetch one cursor page of SHIT holders, classified and formatted.
//
// the token's decimals and total supply come from the intear api (via
// the summary), not from a local constant, so the page's numbers are
// always the ones the api reports.
export async function fetch_shit_holders_fun(
  cursor: string | null,
  price_usd: number,
  decimals: number,
  total_supply_raw: bigint,
): Promise<HUGGIES_SHIT_HOLDERS_PAGE> {
  const response = await api_intear_holders_get({
    token: HUGGIES_SHIT_TOKEN_ID,
    limit: HUGGIES_SHIT_HOLDERS_PAGE_SIZE,
    cursor: cursor ?? undefined,
  });
  const rows = response.rows.map((row) => {
    const account_id = row[0];
    const balance = row[1];
    const amount = raw_to_human_fun(balance, decimals);
    const usd_value = amount * price_usd;
    const percent = balance_percent_fun(balance, total_supply_raw);
    return {
      account_id,
      balance,
      amount,
      amount_formatted: format_amount_fun(amount),
      usd_value,
      usd_formatted: format_usd_fun(usd_value),
      percent,
      percent_formatted: format_percent_fun(percent),
      type: shit_holder_type_fun(account_id),
    };
  });
  return {
    rows,
    total: response.total,
    next_cursor: response.next_cursor,
  };
}
// ========================================
// the icon each holder type is tagged with.
export function shit_holder_icon_fun(type: HUGGIES_SHIT_HOLDER_TYPE): string {
  switch (type) {
    case "dev":
      return "👨‍💻";
    case "dex":
      return "🔄";
    case "nft":
      return "🖼️";
    case "vault":
      return "🏦";
    case "burn":
      return "🔥";
    default:
      return "👤";
  }
}
// ========================================
// the human-readable label of one holder type.
export function shit_holder_type_label_fun(
  type: HUGGIES_SHIT_HOLDER_TYPE,
): string {
  if (type === HUGGIES_SHIT_HOLDER_TYPE_REGULAR) return "HOLDERS";
  return type.toUpperCase();
}
// ========================================
// the human-readable total supply, for the summary block.
// --- WHY --- the supply comes from the intear api, so the number shown
// is the one the api reports rather than a local constant.
export function shit_total_supply_formatted_fun(total_supply: string): string {
  const value = Number(total_supply);
  if (!Number.isFinite(value)) return total_supply;
  return value.toLocaleString();
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
