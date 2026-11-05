// ========================================
// APP_STATE
// what the router's state holds.
//
// the router's state used to be the db pool and nothing else. now it is
// the pool AND the feed bus, because a route that writes to the queue
// has to be able to tell the feed socket about it, and the socket has to
// be able to listen.
//
// --- WHY --- THE BUS IS NOT A GLOBAL: a global bus would work, and it
// would also be reachable from anywhere — including from a test that
// wants its own bus, and from a second server in the same process. the
// state is handed to the router, so the bus belongs to that router and
// to nobody else.
//
// --- WHY --- THE POOL IS STILL IN THE STATE: every route that reads or
// writes needs it, and it is the same pool for every request. the routes
// now take the pool OUT of the state, and nothing else about them
// changed.
use sqlx::SqlitePool;

use crate::backend::logic::feed_ws::feed_ws_bus_fun::FEED_WS_BUS;
// ========================================
/// the state every route gets.
#[derive(Clone)]
pub struct APP_STATE {
    // the db pool. the routes take it out of the state and use it.
    pub pool: SqlitePool,
    // the feed bus. the write routes publish on it and the socket
    // listens to it.
    pub feed_ws: FEED_WS_BUS,
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
