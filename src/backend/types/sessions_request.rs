// ========================================
// SESSIONS_REQUEST
// the body our /api/huggies/sessions route accepts: the signed
// messages of every account the browser holds.
//
// the browser sends ALL of its accounts at once, because the wallet
// signs in with every account it exposes and each one gets its own
// signature. the backend verifies them all and answers with one session
// key for the user.
//
// --- WHY --- the field names are camelCase on the wire: the browser's
// session object already uses camelCase (`accountId`, `publicKey`), so
// the same names are kept all the way through and nothing is renamed on
// the way.
// ========================================
use serde::{Deserialize, Serialize};
// ========================================
// --- TYPES ------------------------------
// one account's signed message.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SESSION_SIGNED_MESSAGE {
    pub account_id: String,
    pub public_key: String,
    pub signature: String,
    pub message: String,
    pub nonce: String,
    pub recipient: String,
}

// the request body.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SESSIONS_REQUEST {
    // every account the browser holds a signature for.
    pub accounts: Vec<SESSION_SIGNED_MESSAGE>,
}
// ========================================
// --- RESPONSE --------------------------
// the answer: the one session key, and the accounts it belongs to.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SESSIONS_RESPONSE {
    // the session key. it is sent ONCE, at the moment it is created, and
    // the browser keeps it. a later sign-in from another device gets the
    // same key back.
    pub session_key: String,
    // the user the session belongs to.
    pub user_id: String,
    // every account the user holds signed in.
    pub accounts: Vec<String>,
    // true when this call created the session, false when it already
    // existed and the same key was handed back.
    pub created: bool,
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
