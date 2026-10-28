// ========================================
// per-group share of the SHIT total supply.
//
// the holder list is grouped by the known-holder type (dev, dex, nft,
// vault, burn) plus the regular holders. this module adds up the raw
// balance of every holder in a group and turns it into a share of the
// SHIT total supply, which comes from the intear api.
// ========================================
import type { HUGGIES_SHIT_HOLDER } from "./token_page_shit_1170_holders";
import type { HUGGIES_SHIT_HOLDER_ROW_TYPE } from "./token_page_shit_1170_known_holders";
import { HUGGIES_SUPPLY_PERCENT } from "./token_supply_percent";
// ========================================
// the share of the total supply one group of holders holds.
export interface HUGGIES_SHIT_HOLDER_GROUP {
  // the holder type this group is made of.
  type: HUGGIES_SHIT_HOLDER_ROW_TYPE;
  // how many holders of this type are in the list.
  count: number;
  // the group's raw balance, summed over its holders.
  raw_total: bigint;
  // the group's share of the total supply, as a percent number.
  percent: number;
  // the group's share of the total supply, formatted for display.
  percent_formatted: string;
}
// ========================================
// the groups the breakdown lists, in display order.
const HUGGIES_SHIT_HOLDER_GROUP_ORDER: ReadonlyArray<HUGGIES_SHIT_HOLDER_ROW_TYPE> =
  ["dev", "dex", "vault", "nft", "burn", "regular"];
// ========================================
// --- HELPERS ----------------------------
// format the share of the total supply the same way the holder rows
// do: two decimals above 0.01%, three above 0.001%, and "<0.001%"
// below that.
function format_group_percent_fun(percent: number): string {
  return HUGGIES_SUPPLY_PERCENT.format(percent);
}
// ========================================
// --- PUBLIC -----------------------------
// add up the holders per group and work out each group's share of the
// total supply.
export function shit_holder_groups_fun(
  holders: ReadonlyArray<HUGGIES_SHIT_HOLDER>,
  total_supply_raw: bigint,
): HUGGIES_SHIT_HOLDER_GROUP[] {
  const raw_totals = new Map<HUGGIES_SHIT_HOLDER_ROW_TYPE, bigint>();
  const counts = new Map<HUGGIES_SHIT_HOLDER_ROW_TYPE, number>();
  for (const holder of holders) {
    let raw = 0n;
    try {
      raw = BigInt(holder.balance);
    } catch {
      raw = 0n;
    }
    raw_totals.set(holder.type, (raw_totals.get(holder.type) ?? 0n) + raw);
    counts.set(holder.type, (counts.get(holder.type) ?? 0) + 1);
  }
  return HUGGIES_SHIT_HOLDER_GROUP_ORDER.filter(
    (type) => (counts.get(type) ?? 0) > 0,
  ).map((type) => {
    const raw_total = raw_totals.get(type) ?? 0n;
    const percent = HUGGIES_SUPPLY_PERCENT.percent(
      raw_total.toString(),
      total_supply_raw.toString(),
    );
    return {
      type,
      count: counts.get(type) ?? 0,
      raw_total,
      percent,
      percent_formatted: format_group_percent_fun(percent),
    };
  });
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
