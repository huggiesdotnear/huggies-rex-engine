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
// it reads the loaded transaction from the page's store. it fetches
// nothing.
import { render } from "preact";
import {
  format_gas,
  format_near_with_unit,
} from "@sleet-js/fastnear-explorer-api-client";
import { HUGGIES_MOUNT_ID } from "../ts/shared/mount_ids";
import { HUGGIES_APP_PAGE_TX_STORE } from "../ts/tx/app_page_tx_store";
import { use_page_store_fun } from "../ts/shared/use_page_store";
import { huggies_code_block_fun } from "./shared/code_block";
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
          <div key={`${action.type}-${index}`}>
            <div class="tx-action-head">
              <span class="tx-action-type">{action_summary_fun(action)}</span>
              {action.gas !== undefined && (
                <span class="tx-action-gas">{format_gas(action.gas)}</span>
              )}
              {deposit_fun(action) !== null && (
                // --- WHY --- the deposit is formatted and not shown raw: it
                // is a yoctoNEAR integer, so "9 NEAR" would otherwise read
                // as "9000000000000000000000000 NEAR".
                <span class="tx-action-deposit">
                  {format_near_with_unit(deposit_fun(action) as string)}
                </span>
              )}
            </div>
            {huggies_code_block_fun({
              code: JSON.stringify(action.raw, null, 2),
            })}
          </div>
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
