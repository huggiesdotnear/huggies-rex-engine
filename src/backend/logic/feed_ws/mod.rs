// ========================================
// FEED_WS
// the live feed: the socket, the bus it listens on, and the event that
// travels on it.
//
// it fronts the socket route: `/api/shit-1170/feed/ws`.
//
// --- WHY --- these live together: the socket, the bus and the event are
// ONE thing seen from three sides — the route publishes an event, the
// bus carries it, the socket hands it to the reader. splitting them
// across folders would hide that they are one concern.
//
// --- WHY --- THE EVENT IS ITS OWN FILE: the json on the wire is the
// contract with the client, and it is written down ONCE here so the
// queue route and the swap route cannot drift apart on it.
//
// --- WHY --- THE STATE LIVES HERE AND NOT IN `server/`: the state holds
// the bus, and the bus is the feed's. the server folder is about how the
// app is bound and how it says hello, and the bus is neither.
pub mod app_state;
pub mod feed_ws_bus_fun;
pub mod feed_ws_event;
#[cfg(test)]
pub mod feed_ws_event_test;
pub mod feed_ws_publish_fun;
// ========================================
// copyright 2026 by sleet.near
// ========================================
