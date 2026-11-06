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
// --- WHY --- THE MODE BUTTONS ARE `<button>` AND NOT TABS: they change
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
  decode_base64_bytes_raw,
  default_args_view_mode,
  fastfs_bytes_to_hex_fun,
} from "@sleet-js/fastnear-explorer-api-client";
import { shit_1170_code_block_fun } from "./code_block";
import type { DECODED_ARGS } from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the mode the bytes are read in.
export type SHIT_1170_ARGS_VIEW_MODE = "json" | "raw" | "hex" | "base64";
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
  ) as SHIT_1170_ARGS_VIEW_MODE;
  const [mode, set_mode] = use_state<SHIT_1170_ARGS_VIEW_MODE>(default_mode);
  // --- WHY --- the modes come from the client: it offers the json view
  // only when there IS json, so a reader is never shown a mode that
  // cannot work.
  const modes = args_view_modes(
    decoded.json !== null,
  ) as SHIT_1170_ARGS_VIEW_MODE[];

  // --- WHY --- THE HEX VIEW USES THE RAW BYTES AND NOT THE DECODED
  // ONES: the arguments decoder decodes the base64 to utf-8 TEXT and
  // re-encodes it, and that round trip is LOSSY for anything that is
  // not valid utf-8 — a png is not utf-8, and the byte `89` comes back
  // as `ef bf bd`, three bytes where there was one. a hex dump has to
  // show the bytes exactly, so it uses the client's lossless decoder.
  const raw_bytes = decode_base64_bytes_raw(props.base64);
  const hex_bytes = raw_bytes ?? decoded.bytes;

  if (decoded.bytes.length === 0) {
    return <div class="args-viewer is-empty">NO ARGUMENTS</div>;
  }

  return (
    <div class="args-viewer">
      <div class="args-toolbar">
        <span class="args-size">{hex_bytes.length} BYTES</span>
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
        {/* --- WHY --- THE JSON MODE SHOWS THE PARSED VALUE AND NOT THE
            RAW BYTES: the raw bytes of a json argument are json with
            the whitespace already gone, so the pretty-printed form is
            the same value and much easier to read. */}
        {mode === "json" &&
          decoded.json !== null &&
          shit_1170_code_block_fun({
            code: JSON.stringify(decoded.json, null, 2),
          })}
        {mode === "raw" && (
          <div class="args-text">
            {shit_1170_code_block_fun({ code: decoded.text })}
          </div>
        )}
        {mode === "hex" && (
          <div class="args-text is-hex">
            {/* --- WHY --- THE HEX IS THE FASTFS HEX AND NOT THE PLAIN
                ONE: the plain hex is one long line, and a long line of
                hex is unreadable — the reader cannot count the offset
                and cannot see where one field ends and the next
                begins. the FastFS hex breaks every sixteen bytes, so
                the bytes on a line line up with the offset, and it is
                the same format the queue page's raw bytes use.

                --- WHY --- IT IS SHOWN PLAIN AND NOT HIGHLIGHTED: a hex
                dump is not json, and the json grammar escapes the
                characters in it — the byte `89` comes out as `ef bf
                bd`. a hex dump must show the bytes exactly. */}
            {shit_1170_code_block_fun({
              code: fastfs_bytes_to_hex_fun(hex_bytes),
              plain: true,
            })}
          </div>
        )}
        {mode === "base64" && (
          <div class="args-text">
            {shit_1170_code_block_fun({ code: props.base64 })}
          </div>
        )}
      </div>
    </div>
  );
}
// ========================================
// --- PUBLIC ---------------------------
// the viewer, called the way the app calls its components.
export function shit_1170_args_viewer_fun(props: {
  base64: string;
  decoded: DECODED_ARGS;
}): preact.JSX.Element {
  return <ARGS_VIEWER_FUN base64={props.base64} decoded={props.decoded} />;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
