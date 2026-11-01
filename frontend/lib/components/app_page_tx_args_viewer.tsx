// ========================================
// the arguments viewer: what a function call was called with.
//
// a function call's arguments arrive as a base64 string, and they are
// one of four things — json, plain text, binary, or the base64
// itself. so the viewer shows the bytes and lets the reader pick how
// they are read.
//
// --- WHY --- the fastnear explorer shows the same four views (JSON,
// UTF-8, Hex, Base64) and the fastnear client decodes the arguments
// for us, so the modes here are the ones the data actually has.
//
// --- WHY --- the mode buttons are `<button>` and not tabs: they change
// what is shown inside the box, and the box stays where it is.
//
// --- WHY --- IT IS A COMPONENT AND NOT A PLAIN FUNCTION: the chosen
// mode is a piece of state, and a plain function called from a map
// would put every action's mode in the same place — so switching one
// argument's view would switch them all.
//
// this component does NOT fetch. it renders what it is given.
import { useState as use_state } from "preact/hooks";
import {
  args_view_modes,
  bytes_to_hex,
  default_args_view_mode,
} from "@sleet-js/fastnear-explorer-api-client";
import { huggies_json_viewer_fun } from "./app_page_tx_json_viewer";
import type { DECODED_ARGS } from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the mode the bytes are read in.
export type HUGGIES_ARGS_VIEW_MODE = "json" | "raw" | "hex" | "base64";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function ARGS_VIEWER_FUN(props: {
  base64: string;
  // the arguments, already decoded by the fastnear client's parser.
  //
  // --- WHY --- IT IS PASSED IN AND NOT DECODED HERE: the parser
  // decodes the arguments once, when it parses the transaction, and
  // hands the result over. decoding them again on every render would
  // do the same work over and over for a big payload.
  decoded: DECODED_ARGS;
}): preact.JSX.Element {
  const decoded = props.decoded;
  // --- WHY --- the default mode comes from the client: it knows
  // whether the bytes are json and whether they are printable text, so
  // the first view is the one that shows something readable.
  const default_mode = default_args_view_mode(
    decoded.json !== null,
    decoded.is_printable,
  ) as HUGGIES_ARGS_VIEW_MODE;
  const [mode, set_mode] = use_state<HUGGIES_ARGS_VIEW_MODE>(default_mode);
  // --- WHY --- the modes come from the client: it offers the json view
  // only when there IS json, so a reader is never shown a mode that
  // cannot work.
  const modes = args_view_modes(decoded.json !== null) as HUGGIES_ARGS_VIEW_MODE[];

  if (decoded.bytes.length === 0) {
    return <div class="args-viewer is-empty">NO ARGUMENTS</div>;
  }

  return (
    <div class="args-viewer">
      <div class="args-toolbar">
        <span class="args-size">{decoded.bytes.length} BYTES</span>
        <span class="args-modes">
          {modes.map((item) => (
            <button
              type="button"
              class={item === mode ? "is-active" : ""}
              aria-pressed={item === mode}
              onClick={() => set_mode(item)}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </span>
      </div>
      <div class="args-body">
        {mode === "json" &&
          decoded.json !== null &&
          huggies_json_viewer_fun({ value: decoded.json })}
        {mode === "raw" && <pre class="args-text">{decoded.text}</pre>}
        {mode === "hex" && (
          <pre class="args-text">{bytes_to_hex(decoded.bytes)}</pre>
        )}
        {mode === "base64" && <pre class="args-text">{props.base64}</pre>}
      </div>
    </div>
  );
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the viewer, called the way the app calls its components.
export function huggies_args_viewer_fun(props: {
  base64: string;
  decoded: DECODED_ARGS;
}): preact.JSX.Element {
  return <ARGS_VIEWER_FUN base64={props.base64} decoded={props.decoded} />;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
