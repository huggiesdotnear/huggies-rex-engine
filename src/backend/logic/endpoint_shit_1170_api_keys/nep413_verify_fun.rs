// ========================================
// NEP413_VERIFY_FUN
// verify one NEAR account's NEP-413 signed message.
//
// this is the backend's check that a claimed account id really belongs
// to whoever sent the signature. without it, anybody could post a
// signature made by another account and be handed an api key for it.
//
// --- WHY --- near-kit-rs does the work and not this file: the browser
// signs with near-kit's JAVASCRIPT package, and the two have to agree
// byte for byte. near-kit-rs is the same project in rust, so its
// `verify_signature` is the reference implementation — writing the
// serialization by hand here would be a copy that could silently drift.
//
// --- WHY --- the message, the nonce and the recipient all come from the
// REQUEST and are checked against the signature: a signature is only
// meaningful for the exact triple that was signed. a caller cannot hand
// us a valid signature over a DIFFERENT message and have it accepted.
//
// --- WHY --- the nonce's age is NOT checked here: the browser's session
// may have been signed in hours ago and is sent to us when the reader
// opens the page. the nonce is a replay guard for the SIGN-IN handshake,
// and the session is re-verified against the chain instead — see
// nep413_verify_key_fun.
//
// --- WHY --- NOTHING SECRET IS STORED OR EXPECTED: a NEP-413
// signature is made by the user's wallet, which keeps the private key.
// the app only ever holds the PUBLIC key and the signature, and neither
// can sign anything. so a leaked browser storage or a leaked db row
// cannot be used to sign a message as that user.
// ========================================
use near_kit::standards::nep413::{
    NonceValidation, SignMessageParams, SignedMessage, verify_signature,
};
// ========================================
// --- CONFIG -----------------------------
// how long a signed message stays fresh.
//
// --- WHY --- the age is generous: the signed session in the browser's
// storage is not fresh — it was made when the user signed in, which may
// have been days ago. the nonce's timestamp is only a sanity check
// against a forged one, not the real identity check.
const SHIT_1170_NEP413_MAX_AGE_MS: u64 = 30 * 24 * 60 * 60 * 1000;
// ========================================
// --- INPUT ------------------------------
// the pieces of a signed message, as they arrive from the browser.
#[derive(Debug, Clone)]
pub struct NEP413_SIGNED_MESSAGE {
    // the account id that claims to have signed.
    pub account_id: String,
    // the public key of that account, as `ed25519:<base58>`.
    pub public_key: String,
    // the signature, base64.
    pub signature: String,
    // the exact message that was signed.
    pub message: String,
    // the 32-byte nonce, base64.
    pub nonce: String,
    // the recipient the message was addressed to.
    pub recipient: String,
}
// ========================================
// --- RESULT -----------------------------
// why a verification failed, so the route can say what went wrong.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NEP413_VERIFY_ERROR {
    // the account id was not a valid NEAR account id.
    MalformedAccountId,
    // the public key was not a valid NEAR public key.
    MalformedPublicKey,
    // the signature could not be decoded.
    MalformedSignature,
    // the nonce was not 32 bytes, or not base64.
    MalformedNonce,
    // the signature did not match the message and the public key.
    SignatureMismatch,
}
// ========================================
// --- HELPERS ----------------------------
// decode a base64 string into bytes.
fn base64_decode_fun(value: &str) -> Option<Vec<u8>> {
    use base64::Engine;
    use base64::engine::general_purpose::STANDARD;
    STANDARD.decode(value.trim().as_bytes()).ok()
}

// build near-kit's `SignedMessage` from the browser's strings.
//
// --- WHY --- the signature is decoded here and not by serde: the
// browser sends a base64 signature, and near-kit's type takes the raw
// bytes. the public key and the account id are parsed by near-kit
// itself, so its own rules for what a valid account id and a valid
// public key are are the ones that apply.
fn to_signed_message_fun(
    signed: &NEP413_SIGNED_MESSAGE,
) -> Result<SignedMessage, NEP413_VERIFY_ERROR> {
    // --- WHY --- the whole struct is built by SERDE and not field by
    // field: near-kit's `SignedMessage` has a deserializer that accepts
    // every signature format a wallet can send — bare base64 (the spec's
    // format), `ed25519:<base58>`, and plain base58. near-kit's own
    // `Signature::from_str` accepts only the prefixed form, so parsing
    // the fields by hand would reject the base64 the browser actually
    // sends. letting serde do it means near-kit's own rules apply.
    let json = serde_json::json!({
      "accountId": signed.account_id.trim(),
      "publicKey": signed.public_key.trim(),
      "signature": signed.signature.trim(),
    });
    serde_json::from_value::<SignedMessage>(json).map_err(|err| {
        // the error names which of the three fields was wrong, so the
        // client can say something useful.
        //
        // --- WHY --- the check is on the message and not on the field
        // order: serde reports the FIRST field that failed to parse, and
        // the fields are parsed in the order they are written here.
        let text = err.to_string();
        if text.contains("accountId") {
            NEP413_VERIFY_ERROR::MalformedAccountId
        } else if text.contains("Invalid key format") {
            // near-kit's message for a public key that is not `ed25519:...`.
            NEP413_VERIFY_ERROR::MalformedPublicKey
        } else {
            NEP413_VERIFY_ERROR::MalformedSignature
        }
    })
}

// build near-kit's `SignMessageParams` from the browser's strings.
fn to_sign_params_fun(
    signed: &NEP413_SIGNED_MESSAGE,
) -> Result<SignMessageParams, NEP413_VERIFY_ERROR> {
    let nonce_bytes =
        base64_decode_fun(&signed.nonce).ok_or(NEP413_VERIFY_ERROR::MalformedNonce)?;
    let nonce: [u8; 32] = nonce_bytes
        .as_slice()
        .try_into()
        .map_err(|_| NEP413_VERIFY_ERROR::MalformedNonce)?;

    Ok(SignMessageParams {
        message: signed.message.clone(),
        recipient: signed.recipient.clone(),
        nonce,
        callback_url: None,
        state: None,
    })
}
// ========================================
// --- VERIFY -----------------------------
// check that the signature is this account's signature over this exact
// message.
pub fn nep413_verify_fun(signed: &NEP413_SIGNED_MESSAGE) -> Result<(), NEP413_VERIFY_ERROR> {
    let signed_message = to_signed_message_fun(signed)?;
    let params = to_sign_params_fun(signed)?;

    // the age check is skipped: the browser's session is signed once, at
    // sign-in, and is sent to us whenever the reader opens a page.
    //
    // --- WHY --- the timestamp is still CHECKED, just not the age: with
    // `NonceValidation::None` a nonce with a timestamp in the year 3000
    // would pass, and the timestamp is a cheap way to spot a forged
    // nonce. `Duration::MAX` keeps the future check and drops the expiry.
    let max_age = std::time::Duration::from_millis(SHIT_1170_NEP413_MAX_AGE_MS);
    let nonce_validation = NonceValidation::Timestamp { max_age };

    if verify_signature(&signed_message, &params, nonce_validation) {
        Ok(())
    } else {
        Err(NEP413_VERIFY_ERROR::SignatureMismatch)
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
