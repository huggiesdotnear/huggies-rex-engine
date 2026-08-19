//! huggies_rex_ws_events_route
// =========================================
use std::sync::Arc;

use axum::extract::State;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::response::IntoResponse;
use futures_util::{SinkExt, StreamExt};

use crate::logic::types::app_state_type::APP_STATE_TYPE;
// =========================================
pub async fn huggies_rex_ws_events_route(
    ws: WebSocketUpgrade,
    State(state): State<Arc<APP_STATE_TYPE>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| huggies_rex_ws_events_session(socket, state))
}
// =========================================
async fn huggies_rex_ws_events_session(socket: WebSocket, state: Arc<APP_STATE_TYPE>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.event_tx.subscribe();
    let send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            let payload = match serde_json::to_string(&event) {
                Ok(s) => s,
                Err(_) => continue,
            };
            if sender.send(Message::Text(payload.into())).await.is_err() {
                break;
            }
        }
    });
    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Close(_)) | Err(_) => break,
            _ => {}
        }
    }
    send_task.abort();
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
