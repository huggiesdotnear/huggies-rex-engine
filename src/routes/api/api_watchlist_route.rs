//! huggies_rex_api_watchlist_route
// =========================================
use std::path::PathBuf;
use std::sync::Arc;

use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::logic::fun::vault_read_json_fun::huggies_rex_vault_read_json_fun;
use crate::logic::fun::vault_write_json_fun::huggies_rex_vault_write_json_fun;
use crate::logic::types::app_state_type::APP_STATE_TYPE;
use crate::logic::types::watchlist_entry_type::{WATCHLIST_ENTRY_TYPE, WATCHLIST_FILE_TYPE};
// =========================================
pub const VAULT_WATCHLIST_ROUTE_LABEL: &str = "watchlist";
// =========================================
pub fn huggies_rex_watchlist_path(vault_dir: &str) -> PathBuf {
    PathBuf::from(vault_dir).join(crate::logic::constants::vault_const::VAULT_WATCHLIST_FILE_NAME)
}
// =========================================
pub async fn huggies_rex_api_watchlist_get_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
) -> Json<WATCHLIST_FILE_TYPE> {
    let path = huggies_rex_watchlist_path(&state.vault_dir);
    let file: WATCHLIST_FILE_TYPE = huggies_rex_vault_read_json_fun(&path);
    Json(file)
}
// =========================================
#[derive(Debug, Deserialize)]
pub struct WATCHLIST_ADD_BODY_TYPE {
    pub token_account_id: String,
    pub note: Option<String>,
}
// =========================================
pub async fn huggies_rex_api_watchlist_add_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Json(body): Json<WATCHLIST_ADD_BODY_TYPE>,
) -> Response {
    let path = huggies_rex_watchlist_path(&state.vault_dir);
    let mut file: WATCHLIST_FILE_TYPE = huggies_rex_vault_read_json_fun(&path);
    if let Some(existing) = file
        .entries
        .iter_mut()
        .find(|e| e.token_account_id == body.token_account_id)
    {
        existing.note = body.note;
        existing.added_at_unix_ms = Utc::now().timestamp_millis();
    } else {
        file.entries.push(WATCHLIST_ENTRY_TYPE {
            token_account_id: body.token_account_id,
            note: body.note,
            added_at_unix_ms: Utc::now().timestamp_millis(),
        });
    }
    huggies_rex_vault_write_json_fun(&path, &file);
    (StatusCode::OK, Json(file)).into_response()
}
// =========================================
#[derive(Debug, Deserialize)]
pub struct WATCHLIST_REMOVE_QUERY_TYPE {
    pub token_account_id: String,
}
// =========================================
pub async fn huggies_rex_api_watchlist_remove_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    axum::extract::Query(params): axum::extract::Query<WATCHLIST_REMOVE_QUERY_TYPE>,
) -> Response {
    let path = huggies_rex_watchlist_path(&state.vault_dir);
    let mut file: WATCHLIST_FILE_TYPE = huggies_rex_vault_read_json_fun(&path);
    let before = file.entries.len();
    file.entries
        .retain(|e| e.token_account_id != params.token_account_id);
    let removed = before != file.entries.len();
    if removed {
        huggies_rex_vault_write_json_fun(&path, &file);
    }
    #[derive(Serialize)]
    struct R {
        removed: bool,
    }
    (StatusCode::OK, Json(R { removed })).into_response()
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
