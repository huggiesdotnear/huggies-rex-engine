// ========================================
// the transaction's actions: what the transaction actually did.
//
// --- WHY --- THE ACTIONS ARE ONE JSON BLOCK AND NOT A CARD EACH: a
// function call's arguments are json, a key action's permission is
// json, and a stake is a number. showing each action as a card meant
// a row of loose fields with the arguments buried under them. one
// block of json says all of it at once, and it is the same shape the
// explorer shows.
//
// --- WHY --- THE RAW ACTION IS SHOWN AND NOT THE PARSED ONE: the
// parsed action has the method name and the gas lifted out for the
// summary, but the raw action is everything the chain signed. the
// block shows what was signed, so nothing is lost.
//
// --- WHY --- THE ARGUMENTS ARE DECODED IN THE BLOCK: the chain stores
// a function call's arguments as base64, so the raw action holds a
// wall of base64 that says nothing. the block shows the arguments
// decoded into the json they are, and the viewer under it holds the
// same bytes as plain text, hex and base64.
//
// --- WHY --- A FASTFS CALL SHOWS THE FASTFS CARD: a FastFS upload is a
// FILE, and a file shown as base64 says nothing about it. the card
// decodes the bytes and shows the file, the link it is served at and a
// preview of it.
//
// it reads the loaded transaction from the page's store. it fetches
// nothing.
import { render } from "preact";
import {
  format_gas,
  format_near_with_unit,
} from "@sleet-js/fastnear-explorer-api-client";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_TX_STORE } from "../../ts/tx/app_page_tx_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { app_page_tx_action_args_fun } from "../../ts/tx/app_page_tx_action_args";
import { shit_1170_code_block_fun } from "./code_block";
import { shit_1170_args_viewer_fun } from "./app_page_tx_args_viewer";
import { shit_1170_fastfs_card_fun } from "./app_page_tx_fastfs";
import type { PARSED_ACTION } from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the one-line summary of an action.
//
// --- WHY --- the type is a plain string and not a union: the parser
// says "Unknown" for an action it does not know, and the raw action is
// still there. so the summary falls back to the type itself.
function action_summary_fun(action: PARSED_ACTION): string {
  if (action.type === "FunctionCall") {
    return action.method_name ?? "call";
  }
  return action.type;
}
// ========================================
// ========================================
// --- DEPOSIT --------------------------
// the deposit an action carried, when it carried one.
//
// --- WHY --- a deposit of zero is not shown: every action carries the
// field, and zero means there was none.
function deposit_fun(action: PARSED_ACTION): string | null {
  if (action.deposit === undefined) return null;
  if (action.deposit === "0") return null;
  return action.deposit;
}
// ========================================
// ========================================
// --- ACTION ---------------------------
// one action: its summary, the action itself with the arguments decoded,
// and the arguments viewer.
//
// --- WHY THE CARD IS A COMPONENT AND NOT A FUNCTION: it is used by the
// queue page too, and the two must show the same card.
//
// --- WHY THE SIGNER IS THE PREDECESSOR: a FastFS file is served under
// the account that SIGNED the transaction — the receipt's predecessor —
// not under the account the call was made to. the receiver is any
// account, and `fastfs.near` is only the convention.
function action_fun(
  action: PARSED_ACTION,
  signer_id: string,
  receiver_id: string,
): preact.JSX.Element {
  const deposit = deposit_fun(action);
  // the action's arguments, decoded. the helper returns the base64 for
  // the viewer's own base64 mode and the action with the arguments
  // replaced by the json they are.
  const args = app_page_tx_action_args_fun(action.raw);
  // the FastFS card, when this action is a FastFS upload. it is null
  // for every other call, and for a FastFS call whose bytes are not
  // FastFS borsh.
  //
  // --- WHY THE BASE64 IS HANDED OVER AND NOT THE DECODED BYTES: the
  // arguments decoder the viewer uses decodes the base64 to utf-8 TEXT
  // and re-encodes it, and that round trip is lossy for a binary
  // payload — a png is not utf-8, and its bytes come back changed and
  // longer. the card uses the client's lossless decoder instead.
  const fastfs =
    args.base64 === null
      ? null
      : shit_1170_fastfs_card_fun({
          args_base64: args.base64,
          method_name: action.method_name ?? "",
          predecessor: signer_id,
          receiver: receiver_id,
          // --- WHY IT IS ON CHAIN: the transaction is on the chain —
          // that is what the page shows — so the indexer has had the
          // chance to pick the file up, and the url works.
          is_on_chain: true,
        });
  return (
    <>
      <div class="tx-action-head">
        <span class="tx-action-type">{action_summary_fun(action)}</span>
        {action.gas !== undefined && (
          <span class="tx-action-gas">{format_gas(action.gas)}</span>
        )}
        {deposit !== null && (
          // --- WHY --- the deposit is formatted and not shown raw: it
          // is a yoctoNEAR integer, so "9 NEAR" would otherwise read
          // as "9000000000000000000000000 NEAR".
          <span class="tx-action-deposit">
            {format_near_with_unit(deposit)}
          </span>
        )}
      </div>
      {fastfs}
      {shit_1170_code_block_fun({
        code: JSON.stringify(args.action, null, 2),
      })}
      {args.base64 !== null &&
        args.decoded !== null &&
        shit_1170_args_viewer_fun({
          base64: args.base64,
          decoded: args.decoded,
        })}
    </>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_TX_ACTIONS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_TX_STORE);
  const data = state.data;
  // no transaction yet — there is nothing to show.
  if (data === null) return null;
  const actions = data.parsed.actions;
  // a transaction with no actions is nothing — it can only be a
  // receipt on its own, which is not a transaction.
  if (actions.length === 0) return null;
  // the account that signed, and the account the transaction was made
  // to. a FastFS file is served under the signer.
  const signer_id = data.parsed.signer_id;
  const receiver_id = data.parsed.receiver_id;

  return (
    <section class="tx-actions">
      <h2>ACTIONS ({actions.length})</h2>
      <div class="tx-actions-list">
        {actions.map((action, index) => (
          <div key={`${action.type}-${index}`} class="tx-action">
            {action_fun(action, signer_id, receiver_id)}
          </div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_TX_ACTIONS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_TX_ACTIONS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
