// ========================================
// API_KEY_OF_HEADER_FUN
// pull the api key out of the request's headers.
//
// --- WHY --- the key comes from a header and not from a query
// parameter: a url ends up in logs and in the referer of the next page,
// and a bearer token in a url is a bearer token in everybody's browser
// history.
//
// --- WHY --- the header name is read case-insensitively: http header
// names are case-insensitive, and axum's `HeaderMap` already lowercases
// them, so `x-api-key` and `X-Api-Key` are the same header.
use axum::http::HeaderMap;
// ========================================
// --- CONFIG -----------------------------
// the header the api key travels in.
const SHIT_1170_API_KEY_HEADER: &str = "x-api-key";

// the OLD header name, still accepted during the beta.
//
// --- WHY --- both names are accepted: the credential in it is not a
// browser session. the user signs in once and hands the key to an agent,
// and the agent holds it as a bearer token for as long as it lives. a
// "session" describes the browser's short use of it; an "api key"
// describes what it actually is.
//
// --- WHY --- the old name keeps working for now: an agent built against
// `x-session-token` would break the moment the backend stopped reading
// it, and that agent is out in the world already. so during the beta the
// backend reads BOTH headers, and the middleman sends BOTH. the old
// header goes away when the beta is over.
//
// --- WHY --- the new name wins when BOTH are present: the new name is
// the one the backend asks for, so if a caller sends both and they
// disagree, the new one is the answer. reading the old one first would
// let a stale key override the fresh one.
const SHIT_1170_SESSION_TOKEN_HEADER_LEGACY: &str = "x-session-token";
// ========================================
// --- READ ------------------------------
// the api key in the headers, or None.
//
// --- WHY --- the value is TRIMMED: a header that picked up a stray
// space or a newline would hash to something no row has, and the caller
// would be told their key is not one of ours when it is.
//
// --- WHY --- an EMPTY header is treated as no header at all: an empty
// value is not a key, and hashing it would look up a row that cannot
// exist.
pub fn api_key_of_header_fun(headers: &HeaderMap) -> Option<&str> {
    let from_new = header_value_fun(headers, SHIT_1170_API_KEY_HEADER);
    if from_new.is_some() {
        return from_new;
    }

    // the legacy header is the fallback.
    header_value_fun(headers, SHIT_1170_SESSION_TOKEN_HEADER_LEGACY)
}

// one header's value, trimmed, or None if it is absent or empty.
//
// --- WHY --- the header lookup is by the lowercased name: axum's
// `HeaderMap` stores header names in lower case, so a constant written
// in upper case would never be found.
fn header_value_fun<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
