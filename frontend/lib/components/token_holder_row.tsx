// ========================================
// the holders table row: rank, account, and the unified token amount
// (decimal amount, usd value). renders through the same amount display
// the account balance rows use, so the two tables cannot drift apart.
import { token_amount_display_fun } from "../ts/token_amount_display";
import { current_app_depth_fun } from "../ts/app_depth";
import type { HUGGIES_TOKEN_INFO } from "../ts/token_info";
// ========================================

// ========================================
// --- ROW -------------------------------
// render one holder row.
export function token_holder_row_fun(props: {
  key?: string;
  rank: number;
  account_id: string;
  balance: string;
  info: HUGGIES_TOKEN_INFO;
}): preact.JSX.Element {
  const { key, rank, account_id, balance, info } = props;
  const amount = token_amount_display_fun(balance, info);
  const depth = current_app_depth_fun();
  const account_href = `${"../".repeat(depth)}account.html?id=${encodeURIComponent(account_id)}`;
  return (
    <tr key={key}>
      <td class="huggies-holder-rank">{rank}</td>
      <td class="huggies-holder-account">
        <a href={account_href}>{account_id}</a>
      </td>
      <td class="huggies-holder-amount">{amount.decimal}</td>
      <td class="huggies-holder-usd">{amount.usd}</td>
    </tr>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
