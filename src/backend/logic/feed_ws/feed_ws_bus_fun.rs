// ========================================
// FEED_WS_BUS_FUN
// the bus the feed socket listens on.
//
// the bus is a `tokio::sync::broadcast` channel behind an `Arc`. every
// route that writes to the queue publishes on it, and every connected
// feed client holds a subscription.
//
// --- WHY --- A BROADCAST AND NOT A CHANNEL: a channel hands every event
// to ONE reader, and there is more than one reader — every open feed
// page. a broadcast hands every event to EVERY reader, which is exactly
// what a feed is: the same new batch on every screen.
//
// --- WHY --- THE BUS IS BEHIND AN ARC: the router's state is shared by
// every request, and the bus has to be the SAME bus for the routes that
// publish and the socket that listens. `Arc` gives that without a
// global.
//
// --- WHY --- THE BUFFER IS SMALL: a client that cannot keep up is a
// client that is not watching. the buffer holds a few events so a normal
// pause does not lose one, and a client that falls further behind is
// told it lagged and carries on.
use std::sync::Arc;

use tokio::sync::broadcast::{self, Receiver, Sender};

use crate::backend::logic::feed_ws::feed_ws_event::FEED_WS_EVENT;
// ========================================
// --- CONFIG -----------------------------
// how many events the bus holds for a client that has not read yet.
//
// --- WHY --- sixteen: a reader that is a moment behind should not miss
// anything, and a reader that is far behind does not need the whole
// history — it can refetch the list, which is the truth anyway.
pub const FEED_WS_BUS_CAPACITY: usize = 16;
// ========================================
// the bus itself: the sender, shared by everybody who publishes.
#[derive(Clone)]
pub struct FEED_WS_BUS {
    sender: Arc<Sender<FEED_WS_EVENT>>,
}
// ========================================
// --- THE BUS ---------------------------
// a new bus, with nobody listening to it yet.
pub fn feed_ws_bus_new_fun() -> FEED_WS_BUS {
    let (sender, _receiver) = broadcast::channel(FEED_WS_BUS_CAPACITY);
    FEED_WS_BUS {
        sender: Arc::new(sender),
    }
}
// ========================================
// --- PUBLISH ---------------------------
// put one event on the bus.
//
// --- WHY --- THE FAILURE IS RETURNED AND NOT LOGGED HERE: the caller is
// the one that knows whether it can do anything about it, and the publish
// helper is where the "nobody is watching" case is decided. the bus
// itself only carries the event.
//
// --- WHY --- THE ERROR IS BOXED: `SendError` carries the event it could
// not send, and the event is the whole queue item — a big value. boxed,
// the failure is a pointer, and the caller's error is small enough to
// travel in a `Result` without bloating every stack it passes through.
pub fn feed_ws_bus_publish_fun(
    bus: &FEED_WS_BUS,
    event: FEED_WS_EVENT,
) -> Result<usize, Box<broadcast::error::SendError<FEED_WS_EVENT>>> {
    bus.sender.send(event).map_err(Box::new)
}
// ========================================
// --- SUBSCRIBE -------------------------
// listen to the bus.
//
// --- WHY --- the receiver is handed out and NOT kept by the bus: a
// receiver is ONE reader's view of the bus, and the bus is shared by
// every reader.
pub fn feed_ws_bus_subscribe_fun(bus: &FEED_WS_BUS) -> Receiver<FEED_WS_EVENT> {
    bus.sender.subscribe()
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
