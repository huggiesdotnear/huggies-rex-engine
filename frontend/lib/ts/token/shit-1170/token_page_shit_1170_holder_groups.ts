// ========================================
// per-group share of the SHIT total supply.
//
// the holder list is grouped by the known-holder type (dev, dex, nft,
// vault, burn) plus the regular holders. this module adds up the raw
// balance of every holder in a group and turns it into a share of the
// SHIT total supply, which comes from the intear api.
// ========================================
import type { SHIT_1170_SHIT_HOLDER } from "./token_page_shit_1170_holders";
import type { SHIT_1170_SHIT_HOLDER_ROW_TYPE } from "./token_page_shit_1170_known_holders";
import { SHIT_1170_SUPPLY_PERCENT } from "../../shared/token_supply_percent";
// ========================================
// the share of the total supply one group of holders holds.
export interface SHIT_1170_SHIT_HOLDER_GROUP {
  type: SHIT_1170_SHIT_HOLDER_ROW_TYPE;
  // how many holders of this type are in the list.
  count: number;
  // the group's raw balance, summed over its holders.
  raw_total: bigint;
  percent: number;
  percent_formatted: string;
}
// ========================================
// the groups the breakdown lists, in display order.
const SHIT_1170_SHIT_HOLDER_GROUP_ORDER: ReadonlyArray<SHIT_1170_SHIT_HOLDER_ROW_TYPE> =
  ["dev", "dex", "vault", "nft", "burn", "regular"];
// ========================================
// --- HELPERS ----------------------------
// format the share of the total supply the same way the holder rows do.
function format_group_percent_fun(percent: number): string {
  return SHIT_1170_SUPPLY_PERCENT.format(percent);
}
// ========================================
// --- PUBLIC -----------------------------
// add up the holders per group and work out each group's share of the
// total supply.
export function shit_holder_groups_fun(
  holders: ReadonlyArray<SHIT_1170_SHIT_HOLDER>,
  total_supply_raw: bigint,
): SHIT_1170_SHIT_HOLDER_GROUP[] {
  const raw_totals = new Map<SHIT_1170_SHIT_HOLDER_ROW_TYPE, bigint>();
  const counts = new Map<SHIT_1170_SHIT_HOLDER_ROW_TYPE, number>();
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
  return SHIT_1170_SHIT_HOLDER_GROUP_ORDER.filter(
    (type) => (counts.get(type) ?? 0) > 0,
  ).map((type) => {
    const raw_total = raw_totals.get(type) ?? 0n;
    const percent = SHIT_1170_SUPPLY_PERCENT.percent(
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
