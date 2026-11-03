// ========================================
// a transfer's memo: what the sender wrote about it.
//
// a memo is free text the sender attaches to a transfer — it says what
// the transfer was FOR. it is the one part of a transfer that is not
// on the chain's books, and a reader comes to it for the reason.
//
// --- WHY THE MEMO IS ITS OWN COMPONENT: both the fungible transfers
// and the nft transfers carry one, and they must look the same.
//
// --- WHY THE MEMO GETS A LABEL: it is a line of text under a row of
// amounts, and without a label a reader cannot tell what that line
// is. it is not another amount, and it is not part of the transfer.
//
// --- WHY THE MEMO IS LEFT ALIGNED AND NOT CENTRED: the app's column
// is centred (base/main.css), and the rest of the row is centred with
// it. a memo is a sentence the sender wrote, and a sentence reads
// badly down the middle of a screen. it is a block of text, so it
// reads from the left.
//
// --- WHY A JSON MEMO IS SHOWN AS A CODE BLOCK: a memo is often json
// — a dex writes {"purpose":"transfer_fee"}, and a payment writes a
// reference. as one line of plain centred text it is unreadable, and a
// reader cannot tell a json memo from a plain one. a code block says
// "this is json", shows it formatted, and can be copied.
import { try_parse_json } from "@sleet-js/fastnear-explorer-api-client";
import { huggies_code_block_fun } from "./code_block";
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function huggies_transfer_memo_fun(props: {
  // the memo the sender attached.
  memo: string;
}): preact.JSX.Element {
  const memo = props.memo;
  // the parsed json of the memo, or null when the memo is plain text.
  const parsed = try_parse_json(memo);
  return (
    <div class="tx-transfer-memo">
      <span class="tx-transfer-memo-label">MEMO</span>
      {parsed !== null ? (
        // --- WHY THE JSON IS RE-SERIALISED AND NOT SHOWN AS IT CAME:
        // the chain stores the memo as one line, and the pretty form
        // is the one a reader can read. the values are the same.
        huggies_code_block_fun({
          code: JSON.stringify(parsed, null, 2),
        })
      ) : (
        // --- WHY A PLAIN MEMO IS ITS OWN BLOCK AND NOT A CODE BLOCK: a
        // sentence is not code, and colouring it like json would say
        // it was. it is set as text, in the same left-aligned block.
        <div class="tx-transfer-memo-text">{memo}</div>
      )}
    </div>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
