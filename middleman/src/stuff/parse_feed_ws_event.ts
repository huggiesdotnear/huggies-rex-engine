// ========================================
// PARSE_FEED_WS_EVENT
// read one message off the feed socket and say whether it is an event
// we know.
//
// the socket hands the client whatever the server sent, and the client
// does not trust it: the text is parsed, and the shape is checked. a
// message that is not one of the two known kinds comes back as null,
// and the caller skips it.
//
// --- WHY --- THE WIRE IS NOT TRUSTED: a socket is a channel, and the
// other end may be a stale server, a proxy that injected something, or
// a bug. a message that does not say what it is must never reach the
// page as an event, because the page would read `event.queue` off a
// swap and get undefined where a batch should be.
//
// --- WHY --- ONLY THE ID FIELD IS CHECKED and not every field of the
// payload: the payload is the item shape the list routes already
// answer with, and it is checked in full there. the socket only has to
// know WHICH KIND of message it is, and the one field that says that
// is the id — `queueId` for a batch, `swapId` for a swap. a payload
// that is an object carrying its id is a payload of the right kind.
//
// --- WHY --- null and not a throw: the socket is a stream of many
// messages, and one bad message must not take the connection down. the
// server is allowed to send nothing at all, and a stream of nothing is
// not an error.
// ========================================

import type {
  SHIT_1170_FEED_WS_EVENT,
  SHIT_1170_SWAP_QUEUE,
  SHIT_1170_TX_QUEUE,
} from "../types/shit_1170_feed_ws";

// --- WHY --- the id fields are checked as NON EMPTY STRINGS and not
// just as strings: an empty id is not an id, and a payload with an
// empty id is a payload that never came from our backend.
function has_id_fun(value: unknown, id_field: string): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const id = (value as Record<string, unknown>)[id_field];
  return typeof id === "string" && id.length > 0;
}

// read one message off the wire.
//
// --- WHY --- the input is `unknown` and not `string`: this is the one
// place the untyped world enters the middleman, so the type says so
// and the checks below are what makes the return type true.
export function parse_feed_ws_event(
  value: unknown,
): SHIT_1170_FEED_WS_EVENT | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const message = value as Record<string, unknown>;

  if (message.type === "queue") {
    if (!has_id_fun(message.queue, "queueId")) return null;
    return { type: "queue", queue: message.queue as SHIT_1170_TX_QUEUE };
  }

  if (message.type === "swap") {
    if (!has_id_fun(message.swap, "swapId")) return null;
    return { type: "swap", swap: message.swap as SHIT_1170_SWAP_QUEUE };
  }

  return null;
}
// ========================================
// copyright 2026 by sleet.near
