//! huggies_rex_api_follows_route
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
use crate::logic::types::follow_entry_type::{FOLLOW_ENTRY_TYPE, FOLLOWS_FILE_TYPE};
// =========================================
pub fn huggies_rex_follows_path(vault_dir: &str) -> PathBuf {
    PathBuf::from(vault_dir).join(crate::logic::constants::vault_const::VAULT_FOLLOWS_FILE_NAME)
}
// =========================================
pub async fn huggies_rex_api_follows_get_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
) -> Json<FOLLOWS_FILE_TYPE> {
    let path = huggies_rex_follows_path(&state.vault_dir);
    let file: FOLLOWS_FILE_TYPE = huggies_rex_vault_read_json_fun(&path);
    Json(file)
}
// =========================================
#[derive(Debug, Deserialize)]
pub struct FOLLOWS_ADD_BODY_TYPE {
    pub account_id: String,
    pub note: Option<String>,
}
// =========================================
pub async fn huggies_rex_api_follows_add_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    Json(body): Json<FOLLOWS_ADD_BODY_TYPE>,
) -> Response {
    let path = huggies_rex_follows_path(&state.vault_dir);
    let mut file: FOLLOWS_FILE_TYPE = huggies_rex_vault_read_json_fun(&path);
    if let Some(existing) = file
        .entries
        .iter_mut()
        .find(|e| e.account_id == body.account_id)
    {
        existing.note = body.note;
        existing.added_at_unix_ms = Utc::now().timestamp_millis();
    } else {
        file.entries.push(FOLLOW_ENTRY_TYPE {
            account_id: body.account_id,
            note: body.note,
            added_at_unix_ms: Utc::now().timestamp_millis(),
        });
    }
    huggies_rex_vault_write_json_fun(&path, &file);
    (StatusCode::OK, Json(file)).into_response()
}
// =========================================
#[derive(Debug, Deserialize)]
pub struct FOLLOWS_REMOVE_QUERY_TYPE {
    pub account_id: String,
}
// =========================================
pub async fn huggies_rex_api_follows_remove_route(
    State(state): State<Arc<APP_STATE_TYPE>>,
    axum::extract::Query(params): axum::extract::Query<FOLLOWS_REMOVE_QUERY_TYPE>,
) -> Response {
    let path = huggies_rex_follows_path(&state.vault_dir);
    let mut file: FOLLOWS_FILE_TYPE = huggies_rex_vault_read_json_fun(&path);
    let before = file.entries.len();
    file.entries.retain(|e| e.account_id != params.account_id);
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
