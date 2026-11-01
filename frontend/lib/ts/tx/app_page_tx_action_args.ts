// ========================================
// the action's arguments, decoded.
//
// a function call carries its arguments as a base64 string. the chain
// stores them that way and the fastnear tx api sends them that way —
// every args string in every transaction is base64 — so the decoding
// needs no detection and no guessing: it is unconditional.
//
// this turns one raw action into the action with its arguments
// decoded, ready to be shown as json.
//
// --- WHY --- THE RAW ACTION IS LEFT ALONE WHEN THE ARGUMENTS ARE NOT
// JSON: the arguments that are not json have no json form, so the
// action keeps its base64 and the viewer below holds the bytes.
//
// --- WHY --- THE ACTION IS COPIED AND NOT EDITED: the raw action is
// what the chain signed, and the caller's copy of it must stay that
// way. so the arguments are replaced on a copy.
//
// --- WHY --- THE CLIENT'S OWN HELPERS ARE USED: the client already
// knows that an action is either a single-key object or a bare string,
// and that a payload may be missing. a second copy of that rule here
// would be a second chance to drift.
import {
  decode_args,
  get_action_payload,
} from "@sleet-js/fastnear-explorer-api-client";
import type {
  ACTION,
  DECODED_ARGS,
  RAW_ACTION,
} from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the action's arguments as base64, the arguments decoded, and the
// action with the arguments replaced by the json they are.
//
// --- WHY --- BOTH ARE RETURNED: the viewer needs the base64 for its
// own base64 mode, and the code block needs the decoded action. one
// call, so the two cannot disagree about what the arguments are.
export function app_page_tx_action_args_fun(action: RAW_ACTION): {
  base64: string | null;
  decoded: DECODED_ARGS | null;
  action: RAW_ACTION;
} {
  // --- WHY --- THE RAW ACTION IS CAST TO THE CLIENT'S OWN ACTION TYPE:
  // the client's helper takes its strict action union, and the raw
  // action is the wider shape the same data arrives in. the helper
  // reads both shapes at runtime — a bare string action and a
  // single-key object — so the cast is only about the types, not about
  // the values.
  const payload = get_action_payload(action as ACTION);
  const args =
    payload === null ? null : (payload as Record<string, unknown>).args;
  if (typeof args !== "string") {
    return { base64: null, decoded: null, action };
  }
  const decoded = decode_args(args);
  return {
    base64: args,
    decoded,
    action: app_page_tx_decoded_action_fun(action, decoded),
  };
}
// ========================================
// ========================================
// --- DECODED ACTION -------------------
// the action, with its arguments replaced by the decoded json.
//
// --- WHY --- A BARE STRING ACTION IS LEFT ALONE: the action is either
// a single-key object or a bare string, and there is nowhere to put a
// decoded argument in a bare string.
function app_page_tx_decoded_action_fun(
  action: RAW_ACTION,
  decoded: DECODED_ARGS,
): RAW_ACTION {
  // the arguments that are not json have no json form to show.
  if (decoded.json === null) return action;
  if (typeof action === "string") return action;
  const key = Object.keys(action)[0];
  if (key === undefined) return action;
  const payload = action[key];
  if (typeof payload !== "object" || payload === null) return action;
  const payload_copy = { ...(payload as Record<string, unknown>) };
  payload_copy.args = decoded.json;
  return { [key]: payload_copy };
}
// ========================================
// ========================================
// copyright 2026 by sleet.near
// ========================================
