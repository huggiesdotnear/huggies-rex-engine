// ========================================
// the holders table row: rank, account, the unified token amount
// (decimal amount, usd value) and the share of the total supply.
// renders through the same amount display the account balance rows use,
// so the two tables cannot drift apart.
import { token_amount_row_fun } from "../../../ts/shared/token_amount_row";
import { HUGGIES_SUPPLY_PERCENT } from "../../../ts/shared/token_supply_percent";
import { current_app_depth_fun } from "../../../ts/shared/app_depth";
import type { HUGGIES_TOKEN_INFO } from "../../../ts/shared/token_info";
// ========================================

// ========================================
// --- ROW -------------------------------
export function token_holder_row_fun(props: {
  key?: string;
  rank: number;
  account_id: string;
  balance: string;
  info: HUGGIES_TOKEN_INFO;
  // the token's total supply, in the token's smallest unit, as the raw
  // decimal string the api reports.
  total_supply_raw: string;
}): preact.JSX.Element {
  const { key, rank, account_id, balance, info, total_supply_raw } = props;
  const amount = token_amount_row_fun(balance, info);
  const depth = current_app_depth_fun();
  const account_href = `${"../".repeat(depth)}account.html?id=${encodeURIComponent(account_id)}`;
  // --- WHY --- the share of the supply is worked out HERE and not in the
  // table: the row is the one place that has the raw balance AND the
  // raw supply, and the math is the shared one the $SHIT page and the
  // burn page use.
  const percent = HUGGIES_SUPPLY_PERCENT.percent(balance, total_supply_raw);
  return (
    <tr key={key}>
      <td class="holder-rank">{rank}</td>
      <td class="holder-account">
        <a href={account_href}>{account_id}</a>
      </td>
      <td class="holder-amount">{amount.decimal}</td>
      <td class="holder-usd">{amount.usd}</td>
      <td class="holder-percent">{HUGGIES_SUPPLY_PERCENT.format(percent)}</td>
    </tr>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
