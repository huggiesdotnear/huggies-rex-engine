// ========================================
// the account transactions table row: the transaction, when it happened,
// who was involved, and whether it worked.
//
// it is a shared component because the row's shape is the table's
// shape: the css that gives the row its columns lives with the table,
// so the two cannot drift apart.
//
// it renders what it is given and fetches nothing.
import { time_ago } from "@sleet-js/fastnear-explorer-api-client";
import { current_app_depth_fun } from "../../ts/app_depth";
import { tx_detail_href_fun } from "../../ts/tx_link";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// how the account was involved in the transaction, in one word.
//
// --- WHY --- the api says how in four different ways — the account
// signed it, received it, ran one of its receipts, or was an argument
// to it — and a row that showed all of them would be unreadable. the
// first one that applies is the one that matters, and the row shows it.
export type HUGGIES_TX_INVOLVEMENT =
  | "SENT"
  | "RECEIVED"
  | "CONTRACT"
  | "DELEGATED"
  | "EVENT";
// ========================================
// --- INVOLVEMENT -----------------------
function involvement_fun(props: {
  is_real_signer: boolean;
  is_delegated_signer: boolean;
  is_real_receiver: boolean;
  is_predecessor: boolean;
  is_event_log: boolean;
}): HUGGIES_TX_INVOLVEMENT {
  if (props.is_real_signer) return "SENT";
  if (props.is_delegated_signer) return "DELEGATED";
  if (props.is_real_receiver) return "RECEIVED";
  if (props.is_predecessor) return "CONTRACT";
  return "EVENT";
}
// ========================================
// ========================================
// --- ROW -------------------------------
export function account_tx_row_fun(props: {
  key?: string;
  tx_hash: string;
  timestamp: string;
  height: number;
  is_success: boolean;
  involvement: HUGGIES_TX_INVOLVEMENT;
}): preact.JSX.Element {
  const { key, tx_hash, timestamp, height, is_success, involvement } = props;
  const depth = current_app_depth_fun();
  const tx_href = tx_detail_href_fun(tx_hash, depth);
  return (
    <tr key={key}>
      <td class="tx-hash">
        <a href={tx_href}>{tx_hash}</a>
      </td>
      <td class="tx-time">{time_ago(timestamp)}</td>
      <td class="tx-height">{height.toLocaleString()}</td>
      <td class="tx-involvement">{involvement}</td>
      <td class={is_success ? "tx-status" : "tx-status is-failed"}>
        {is_success ? "OK" : "FAILED"}
      </td>
    </tr>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
