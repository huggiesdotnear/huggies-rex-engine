// ========================================
// SHIT_1170_FEED_WS
// the shapes of our own live feed, under /api/shit-1170/feed/ws.
//
// the socket is a WEBSOCKET UPGRADE. the server pushes one json text
// message per event, and the message is one of exactly two shapes:
//
//   { "type": "queue", "queue": { ...TX_QUEUE_ITEM... } }
//   { "type": "swap",  "swap":  { ...SWAP_QUEUE_ITEM... } }
//
// the server sends NOTHING ELSE. no ping with a payload, no ack, no
// error envelope. a client that connects and receives nothing is simply
// a client with no new work.
//
// --- WHY --- the payloads are the EXACT item shapes of the list
// routes: `queue` is a SHIT_1170_TX_QUEUE and `swap` is a
// SHIT_1170_SWAP_QUEUE. a live event can be dropped straight into the
// same list the api fills, without touching it, and there is only one
// shape for one thing.
//
// --- WHY --- it is a DISCRIMINATED UNION and not a struct with two
// optional payloads: an optional pair can hold neither field, and a
// message that is neither a queue nor a swap is a message with no
// meaning. the union has no such state — every message it can hold
// says what it is.
//
// --- WHY --- the tag is `type` and the payload is named after the
// kind: the client reads one field to know what it got, and then reads
// the payload beside it.
// ========================================

import type { SHIT_1170_SWAP_QUEUE } from "./shit_1170_swap_queue";
import type { SHIT_1170_TX_QUEUE } from "./shit_1170_tx_queue";

// one message on the feed socket.
//
// --- WHY --- the two variants are the two things the server pushes:
// a queued batch of transactions, and a queued swap. there is no third
// kind, and a client that saw one would not know what to do with it.
export type SHIT_1170_FEED_WS_EVENT =
  | { type: "queue"; queue: SHIT_1170_TX_QUEUE }
  | { type: "swap"; swap: SHIT_1170_SWAP_QUEUE };

// --- WHY --- the two payload types are re-exported here: a caller of
// the feed socket wants the item shapes next to the event shape, and
// the event file is where the event lives.
export type { SHIT_1170_SWAP_QUEUE, SHIT_1170_TX_QUEUE };
// ========================================
// copyright 2026 by sleet.near
