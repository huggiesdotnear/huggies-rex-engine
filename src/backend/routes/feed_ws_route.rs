// ========================================
// FEED_WS_ROUTE
// GET /api/shit-1170/feed/ws — the live feed.
//
// the socket is a WEBSOCKET UPGRADE. the client opens it and the server
// pushes one json text message per event:
//
//   { "type": "queue", "queue": { ...TX_QUEUE_ITEM... } }
//   { "type": "swap",  "swap":  { ...SWAP_QUEUE_ITEM... } }
//
// the server sends NOTHING ELSE. no ping with a payload, no ack, no
// error envelope. a client that connects and receives nothing is simply
// a client with no new work.
//
// --- WHY --- THE SOCKET IS OPEN AND NEEDS NO API KEY: the queue list it
// replaces is open, and the socket carries the same items in the same
// shape. a socket that asked for a key would be a socket the feed page
// could not open before it had signed in, and the list it replaces does
// not ask for one either.
//
// --- WHY --- THE INCOMING STREAM IS DRAINED: a websocket is closed by
// the CLIENT, and the server only learns about it when the incoming
// stream ends or errors. if the server never read from the socket, a
// closed client would leave the subscription open forever. so the loop
// watches both sides — the events going out and the client going away.
//
// --- WHY --- A MESSAGE FROM THE CLIENT IS IGNORED: the client sends
// nothing. the only thing the server reads from the socket is the fact
// that the client is still there.
//
// --- WHY --- A LAGGED CLIENT IS NOT DROPPED: `Lagged(n)` means the
// client was too slow and missed n events. the truth is still in the db,
// so the client can refetch the list. dropping the connection would turn
// a slow client into a dead one, and the slow client is usually a phone
// on a bad connection that is still worth keeping.
//
// --- WHY --- THE PING IS SENT BY THE SERVER AND CARRIES NOTHING: a ping
// keeps the connection alive through proxies and tells the server the
// client is still there. it is a websocket control frame, not a text
// message, so the client's message handler never sees it.
use axum::extract::State;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::response::Response;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::broadcast::error::RecvError;

use crate::backend::logic::feed_ws::app_state::APP_STATE;
use crate::backend::logic::feed_ws::feed_ws_bus_fun::feed_ws_bus_subscribe_fun;
use crate::backend::logic::feed_ws::feed_ws_event::FEED_WS_EVENT;
// ========================================
// --- CONFIG -----------------------------
// how long between two pings.
//
// --- WHY --- thirty seconds: short enough to notice a client that went
// away, long enough that the pings are not noise.
const FEED_WS_PING_INTERVAL: std::time::Duration = std::time::Duration::from_secs(30);
// ========================================
// --- THE ROUTE -------------------------
// the upgrade. the socket itself is answered by the caller's browser.
pub async fn feed_ws_route(ws: WebSocketUpgrade, State(state): State<APP_STATE>) -> Response {
    // --- WHY --- THE SUBSCRIPTION IS TAKEN HERE AND NOT IN THE HANDLER:
    // a subscriber only sees what is published AFTER it subscribes, so
    // the subscription has to be made before the handler is spawned, or
    // the first event could slip past the reader.
    let receiver = feed_ws_bus_subscribe_fun(&state.feed_ws);

    ws.on_upgrade(move |socket| feed_ws_socket_fun(socket, receiver))
}
// ========================================
// --- THE SOCKET ------------------------
// the loop: events go out, the client going away goes unnoticed.
async fn feed_ws_socket_fun(
    socket: WebSocket,
    mut receiver: tokio::sync::broadcast::Receiver<FEED_WS_EVENT>,
) {
    // the incoming side of the socket. it is split off so the two halves
    // can be watched at once.
    let (mut sender, mut incoming) = socket.split();

    // the ping ticker. it is a separate future so it does not have to be
    // part of the select.
    let mut ping = tokio::time::interval(FEED_WS_PING_INTERVAL);
    // --- WHY --- THE FIRST TICK IS SKIPPED: `interval` fires straight
    // away, and a ping in the first millisecond of the connection says
    // nothing.
    ping.tick().await;

    loop {
        tokio::select! {
            // --- THE EVENTS -----------------
            // an event from the bus.
            event = receiver.recv() => {
                match event {
                    Ok(event) => {
                        // --- WHY --- THE EVENT IS SERIALIZED AND SENT AS
                        // TEXT: the client parses one json message, and a
                        // binary frame would be a different contract.
                        let text = match serde_json::to_string(&event) {
                            Ok(text) => text,
                            Err(err) => {
                                // --- WHY --- A BROKEN EVENT IS SKIPPED AND
                                // NOT FATAL: one bad event must not take
                                // the reader's socket down.
                                eprintln!("[feed-ws] the event would not serialize: {err}");
                                continue;
                            }
                        };

                        if let Err(err) = sender.send(Message::Text(text.into())).await {
                            // --- WHY --- THE CLIENT IS GONE: the socket
                            // cannot be written to any more.
                            eprintln!("[feed-ws] the client is gone: {err}");
                            break;
                        }
                    }
                    // --- WHY --- A LAGGED CLIENT CARRIES ON: the events it
                    // missed are still in the db, and the client can
                    // refetch. the count is logged so a client that is
                    // always behind is visible.
                    Err(RecvError::Lagged(missed)) => {
                        eprintln!("[feed-ws] the client missed {missed} events and carries on");
                    }
                    // --- WHY --- A CLOSED BUS ENDS THE SOCKET: there is
                    // nothing left to send.
                    Err(RecvError::Closed) => {
                        break;
                    }
                }
            }

            // --- THE CLIENT -----------------
            // a message from the client, or the end of the stream.
            //
            // --- WHY --- THE CONTENT IS IGNORED: the client sends
            // nothing, and the only thing this arm is here for is to
            // notice that the client is still there.
            message = incoming.next() => {
                match message {
                    Some(Ok(Message::Close(_))) => {
                        break;
                    }
                    Some(Err(err)) => {
                        eprintln!("[feed-ws] the client broke off: {err}");
                        break;
                    }
                    Some(Ok(_)) => {
                        // a text, a binary, a ping — nothing to do with it.
                    }
                    None => {
                        // --- WHY --- THE STREAM ENDED: the client closed
                        // the socket without a close frame.
                        break;
                    }
                }
            }

            // --- THE PING ------------------
            _ = ping.tick() => {
                // --- WHY --- A PING AND NOT A MESSAGE: a ping is a
                // control frame, and the client's message handler never
                // sees it.
                if let Err(err) = sender.send(Message::Ping(Vec::new().into())).await {
                    eprintln!("[feed-ws] the client is gone: {err}");
                    break;
                }
            }
        }
    }

    // --- WHY --- THE SOCKET IS CLOSED EXPLICITLY: the client may have
    // gone without a close frame, and a closed socket tells it so.
    let _ = sender.close().await;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
