// HUGGIES_TREZU_TREASURIES_ROUTE
// GET /api/trezu/user/treasuries?accountId=<near-account-id>[&includeHidden=true]
//
// proxies the trezu api treasuries list for one account. no upstream
// auth: trezu's treasuries endpoint is public, our backend just saves
// the browser from talking to trezu directly.
//
// the route path mirrors the upstream trezu path (/api/user/treasuries)
// under the /api/trezu/* prefix, so the app being talked to is obvious
// from the url alone.
//
// failure modes, all as json:
//   400 - accountId missing or blank
//   502 - trezu answered non-2xx, timed out, or sent invalid json
// the upstream json array is forwarded as-is on success.
// ====================================
use axum::{
    Json,
    extract::Query,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::Value;

use crate::backend::logic::{
    huggies_trezu_account_id_fun::huggies_trezu_account_id_fun,
    huggies_trezu_base_url_fun::huggies_trezu_base_url_fun,
    huggies_trezu_client_fun::huggies_trezu_client_fun,
    huggies_trezu_error_fun::huggies_trezu_error_fun,
    huggies_trezu_include_hidden_fun::huggies_trezu_include_hidden_fun,
    huggies_trezu_treasuries_path_fun::huggies_trezu_treasuries_path_fun,
};
use crate::backend::types::huggies_trezu_treasuries_query::huggies_trezu_treasuries_query;
// ====================================
pub async fn huggies_trezu_treasuries_route(
    Query(query): Query<huggies_trezu_treasuries_query>,
) -> Response {
    let account_id = match huggies_trezu_account_id_fun(query.account_id.as_deref()) {
        Some(id) => id,
        None => {
            return huggies_trezu_error_fun(
                StatusCode::BAD_REQUEST,
                "invalid_account_id",
                "accountId is required and must not be blank",
            )
            .into_response();
        }
    };

    let include_hidden = huggies_trezu_include_hidden_fun(query.include_hidden.as_deref());

    let url = format!(
        "{}{}?accountId={}&includeHidden={}",
        huggies_trezu_base_url_fun(),
        huggies_trezu_treasuries_path_fun(),
        urlencode_component_fun(&account_id),
        include_hidden,
    );

    let client = huggies_trezu_client_fun();
    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(err) => {
            return huggies_trezu_error_fun(
                StatusCode::BAD_GATEWAY,
                "trezu_unreachable",
                &format!("trezu request failed: {err}"),
            )
            .into_response();
        }
    };

    let status = response.status();
    let body = match response.text().await {
        Ok(text) => text,
        Err(err) => {
            return huggies_trezu_error_fun(
                StatusCode::BAD_GATEWAY,
                "trezu_unreachable",
                &format!("trezu response body could not be read: {err}"),
            )
            .into_response();
        }
    };

    if !status.is_success() {
        return huggies_trezu_error_fun(
            StatusCode::BAD_GATEWAY,
            "trezu_error",
            &format!("trezu responded with status {status}"),
        )
        .into_response();
    }

    let parsed: Value = match serde_json::from_str(&body) {
        Ok(value) => value,
        Err(err) => {
            return huggies_trezu_error_fun(
                StatusCode::BAD_GATEWAY,
                "trezu_invalid_json",
                &format!("trezu response was not valid json: {err}"),
            )
            .into_response();
        }
    };

    if !parsed.is_array() {
        return huggies_trezu_error_fun(
            StatusCode::BAD_GATEWAY,
            "trezu_invalid_json",
            "trezu response was not a json array",
        )
        .into_response();
    }

    (StatusCode::OK, Json(parsed)).into_response()
}
// ====================================
// percent-encode a query value. written by hand instead of pulling in
// the `url` crate for one call.
fn urlencode_component_fun(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char);
            }
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}
// ====================================
// copyright 2026 by sleet.near
