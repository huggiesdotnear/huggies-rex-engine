// ========================================
// the transaction's actions: what the transaction actually did.
//
// each action is one line with its kind and the details that kind
// carries — the method name and the arguments of a function call, the
// beneficiary of a delete, the public key of a key action.
//
// it reads the loaded transaction from the page's store. it fetches
// nothing.
import { render } from "preact";
import { format_gas } from "@sleet-js/fastnear-explorer-api-client";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_APP_PAGE_TX_STORE } from "../ts/app_page_tx_store";
import { use_page_store_fun } from "../ts/use_page_store";
import { huggies_args_viewer_fun } from "./shared/args_viewer";
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
// one action: its summary, the extras it carries and its arguments.
function action_fun(action: PARSED_ACTION): preact.JSX.Element {
  const deposit = deposit_fun(action);
  return (
    <div class="tx-action">
      <div class="tx-action-head">
        <span class="tx-action-type">{action_summary_fun(action)}</span>
        {action.gas !== undefined && (
          <span class="tx-action-gas">{format_gas(action.gas)}</span>
        )}
        {deposit !== null && (
          <span class="tx-action-deposit">{deposit} NEAR</span>
        )}
      </div>
      {action.public_key !== undefined && (
        <code class="tx-action-extra">{action.public_key}</code>
      )}
      {action.beneficiary_id !== undefined && (
        <span class="tx-action-extra">
          BENEFICIARY: {action.beneficiary_id}
        </span>
      )}
      {action.code_hash !== undefined && (
        <code class="tx-action-extra">{action.code_hash}</code>
      )}
      {action.stake !== undefined && (
        <span class="tx-action-extra">STAKE: {action.stake}</span>
      )}
      {action.args !== undefined &&
        huggies_args_viewer_fun({ base64: action.args })}
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function HUGGIES_COMPONENT_TX_ACTIONS_FUN() {
  const state = use_page_store_fun(HUGGIES_APP_PAGE_TX_STORE);
  const data = state.data;
  // no transaction yet — there is nothing to show.
  if (data === null) return null;
  const actions = data.parsed.actions;
  // a transaction with no actions is nothing — it can only be a
  // receipt on its own, which is not a transaction.
  if (actions.length === 0) return null;

  return (
    <section class="tx-actions">
      <h2>ACTIONS ({actions.length})</h2>
      <div class="tx-actions-list">
        {actions.map((action, index) => (
          <div key={`${action.type}-${index}`}>{action_fun(action)}</div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_TX_ACTIONS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_TX_ACTIONS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
