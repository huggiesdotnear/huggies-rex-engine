// ========================================
// the account transactions table row: the transaction, when it happened,
// and whether it worked.
//
// it is a page component because the row's shape is the table's shape:
// the css that gives the row its columns lives with the table, so the
// two cannot drift apart.
//
// --- WHY --- THE ROW IS SIMPLE: the account's history comes from one
// request that answers with hashes and flags. the signer, the receiver
// and the actions live in the full transaction, and the full
// transaction is twenty hashes per request — so a table with those
// columns costs one request for every twenty rows, and the api is
// heavily rate limited in the browser. the reader gets the history
// without the rate limit, and the transaction's own page has
// everything.
//
// it renders what it is given and fetches nothing.
import { time_ago } from "@sleet-js/fastnear-explorer-api-client";
import { CircleCheck, CircleX } from "lucide-preact";
import { current_app_depth_fun } from "../ts/app_depth";
import { tx_detail_href_fun } from "../ts/app_page_account_tx_link";
// ========================================
// ========================================
// --- ROW -------------------------------
export function account_tx_row_fun(props: {
  key?: string;
  tx_hash: string;
  timestamp: string;
  is_success: boolean;
}): preact.JSX.Element {
  const { key, tx_hash, timestamp, is_success } = props;
  const depth = current_app_depth_fun();
  const tx_href = tx_detail_href_fun(tx_hash, depth);
  return (
    <tr key={key}>
      <td class="tx-hash">
        <a href={tx_href}>{tx_hash}</a>
      </td>
      <td class="tx-time">{time_ago(timestamp)}</td>
      <td class="tx-status">
        {/* --- WHY --- AN ICON AND NOT A WORD: the explorer shows the
            status as an icon, and a column of icons reads faster than
            a column of words. the icon carries the meaning for a
            reader who knows it and the title carries it for one who
            does not. */}
        {is_success ? (
          <CircleCheck
            size={16}
            class="is-success"
            aria-label="succeeded"
            title="SUCCEEDED"
          />
        ) : (
          <CircleX
            size={16}
            class="is-failed"
            aria-label="failed"
            title="FAILED"
          />
        )}
      </td>
    </tr>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
