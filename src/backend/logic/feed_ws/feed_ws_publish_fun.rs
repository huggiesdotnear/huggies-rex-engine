// ========================================
// FEED_WS_PUBLISH_FUN
// tell the feed socket that there is new work.
//
// --- WHY --- THE FAILED SEND IS NOT AN ERROR: a broadcast with nobody
// subscribed answers with `Err(SendError)`, and that is the NORMAL case
// when no feed page is open. the write already succeeded — the queue is
// in the db and the route is about to answer 201 — so a missing listener
// must never turn a good write into a bad answer.
//
// --- WHY --- IT IS LOGGED AND NOT SILENT: something that reaches here
// and cannot be delivered is worth knowing about, but it is not worth
// failing over. so it is a line on stderr and the route carries on.
//
// --- WHY --- THE EVENT IS BUILT BY THE CALLER: the caller already has
// the wire shape it is about to answer with, and the event must carry
// THE SAME shape. building it here from the db would read the row again
// and could read a different one.
use crate::backend::logic::feed_ws::feed_ws_bus_fun::{FEED_WS_BUS, feed_ws_bus_publish_fun};
use crate::backend::logic::feed_ws::feed_ws_event::FEED_WS_EVENT;
// ========================================
// --- PUBLISH ---------------------------
// put one event on the bus, and never fail.
pub fn feed_ws_publish_fun(bus: &FEED_WS_BUS, event: FEED_WS_EVENT) {
    if let Err(err) = feed_ws_bus_publish_fun(bus, event) {
        // --- WHY --- the count of the receivers that were there is
        // printed with the error: it says whether nobody was listening
        // (the normal case) or whether the bus itself is broken.
        eprintln!("[feed-ws] the event was not delivered: {err}");
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
