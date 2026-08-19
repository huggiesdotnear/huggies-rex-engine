//! huggies_rex_events_ws_run_fun
//!
//! Single-stream WebSocket subscriber. Opens a WS connection to
//! `events.intear.tech{event_path}`, sends an empty `{}` filter so every
//! event flows through, parses each JSON array batch, and invokes
//! `on_event` for every event. Reconnects with backoff on disconnect.
// =========================================
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use tokio::time::sleep;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;
use tracing::{error, info, warn};

use crate::logic::constants::events_const::{WS_PING_INTERVAL_SECS, WS_RECONNECT_DELAY_SECS};
// =========================================
pub async fn huggies_rex_events_ws_run_fun<F>(
    base_url: &str,
    event_path: &str,
    label: &'static str,
    mut on_event: F,
) where
    F: FnMut(serde_json::Value) + Send + 'static,
{
    let url = format!("{base_url}{event_path}");
    loop {
        info!(%label, %url, "ws: connecting");
        match connect_async(&url).await {
            Ok((mut ws, _resp)) => {
                info!(%label, "ws: connected, sending filter");
                if let Err(e) = ws.send(Message::Text(r#"{"And":[]}"#.into())).await {
                    warn!(%label, ?e, "ws: failed to send filter; reconnecting");
                    sleep(Duration::from_secs(WS_RECONNECT_DELAY_SECS)).await;
                    continue;
                }
                let mut ping_interval =
                    tokio::time::interval(Duration::from_secs(WS_PING_INTERVAL_SECS));
                ping_interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
                loop {
                    tokio::select! {
                        _ = ping_interval.tick() => {
                            if let Err(e) = ws.send(Message::Ping(Vec::<u8>::new().into())).await {
                                warn!(%label, ?e, "ws: ping failed; reconnecting");
                                break;
                            }
                        }
                        msg = ws.next() => {
                            match msg {
                                Some(Ok(Message::Text(text))) => {
                                    if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                                        match &value {
                                            serde_json::Value::Array(items) => {
                                                for item in items {
                                                    on_event(item.clone());
                                                }
                                            }
                                            _ => {
                                                on_event(value);
                                            }
                                        }
                                    } else {
                                        warn!(%label, %text, "ws: failed to parse text frame");
                                    }
                                }
                                Some(Ok(Message::Ping(_))) | Some(Ok(Message::Pong(_))) => {}
                                Some(Ok(Message::Close(reason))) => {
                                    warn!(%label, ?reason, "ws: close received");
                                    break;
                                }
                                Some(Err(e)) => {
                                    error!(%label, ?e, "ws: stream error; reconnecting");
                                    break;
                                }
                                None => {
                                    warn!(%label, "ws: stream ended; reconnecting");
                                    break;
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!(%label, ?e, "ws: connect failed; retrying");
            }
        }
        sleep(Duration::from_secs(WS_RECONNECT_DELAY_SECS)).await;
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
