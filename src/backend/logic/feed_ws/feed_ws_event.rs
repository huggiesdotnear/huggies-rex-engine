// ========================================
// FEED_WS_EVENT
// the ONE message the feed socket sends.
//
// the socket sends one json text message per event, and the message is
// one of two shapes:
//
//   { "type": "queue", "queue": { ...TX_QUEUE_ITEM... } }
//   { "type": "swap",  "swap":  { ...SWAP_QUEUE_ITEM... } }
//
// --- WHY --- it is an ENUM and not a struct with two optional fields: an
// optional pair can hold neither field, and a message that is neither a
// queue nor a swap is a message with no meaning. the enum has no such
// state — every message it can hold says what it is.
//
// --- WHY --- the tag is `type` and the payload is named after the kind:
// the client reads one field to know what it got, and then reads the
// payload beside it. the payload is the EXACT wire shape the list route
// answers with, so a client can drop a live event into the same list it
// fills from the api without touching it.
//
// --- WHY --- the payload is CLONED into the event: the event is handed
// to a broadcast, which keeps it for every subscriber. the item is built
// once by the route and the event carries its own copy, so a subscriber
// cannot change what another subscriber sees.
use serde::Serialize;

use crate::backend::types::swap_queue_request::SWAP_QUEUE_ITEM;
use crate::backend::types::tx_queue_request::TX_QUEUE_ITEM;
// ========================================
/// one message on the feed socket.
///
/// --- WHY --- `rename_all = "camelCase"` on the VARIANTS and NOT on the
/// enum: the variant names are already the plain words `queue` and
/// `swap`, and renaming them would only make them something else.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum FEED_WS_EVENT {
    // a batch of transactions was queued. the payload is the same shape
    // the tx-queue list route answers with.
    #[serde(rename = "queue")]
    Queue { queue: TX_QUEUE_ITEM },
    // a swap was queued. the payload is the same shape the swap-queue
    // list route answers with.
    #[serde(rename = "swap")]
    Swap { swap: SWAP_QUEUE_ITEM },
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
