// ========================================
// SESSIONS_REQUEST
// the body our /api/huggies/sessions route accepts: the signed
// messages of every account the browser holds.
//
// the browser sends ALL of its accounts at once, because the wallet
// signs in with every account it exposes and each one gets its own
// signature. the backend verifies them all and answers with ONE KEY
// PER ACCOUNT.
//
// --- WHY --- the field names are camelCase on the wire: the browser's
// session object already uses camelCase (`accountId`, `publicKey`), so
// the same names are kept all the way through and nothing is renamed on
// the way.
//
// --- WHY --- the response is a LIST and not one key: an account has its
// own key, so a browser holding three accounts holds three keys. the
// list says which key belongs to which account.
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
// one account's session key.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SESSION_KEY_ENTRY {
    // the account the key belongs to.
    pub account_id: String,
    // the session key. it is sent once, at the moment it is made, and
    // the browser keeps it. a later sign-in from another device gets the
    // SAME key back.
    pub session_key: String,
    // true when this call made the key, false when it already existed
    // and the same key was handed back.
    pub created: bool,
}

// the answer: one key per account.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SESSIONS_RESPONSE {
    // one entry per account the browser sent.
    pub keys: Vec<SESSION_KEY_ENTRY>,
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
