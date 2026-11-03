// ========================================
// the NEP-413 verifier, tested against a REAL near-kit signature.
//
// the signature below was produced by near-kit's own
// `keyPair.signNep413Message(...)`, which is what the browser wallet
// calls. if the byte layout the verifier builds ever drifts from
// near-kit's, this test fails — which is the whole point: a verifier
// that is one byte off rejects every real signature, and a verifier
// that is wrong in the other direction accepts forged ones.
//
// the fixture is a fixed signature so the test never depends on the
// machine's randomness.
use crate::backend::logic::nep413_verify_fun::{
    NEP413_SIGNED_MESSAGE, NEP413_VERIFY_ERROR, nep413_verify_fun,
};
// ========================================
// --- FIXTURE ---------------------------
// a signature made by near-kit, for the app's own login message.
//
// --- WHY --- a function and not a const: `to_string` is not a const fn,
// so the fixture is built when the test runs.
fn fixture_fun() -> NEP413_SIGNED_MESSAGE {
    NEP413_SIGNED_MESSAGE {
    account_id: "test.near".to_string(),
    public_key: "ed25519:FrtUfbY74kXpBiWmqeQMtn7jKCX3zJhmwyg32ZqANj3c".to_string(),
    signature:
      "9hN3lqANSh3bCxWWDwAsE7kayGw2K/oq/MWhQK/E9gUtyrqnxguNUmheVetaaLPYqe/SJIpSzXH69g45GSAJDQ=="
        .to_string(),
    message: "I verify I have diaper hands and own this NEAR account.".to_string(),
    nonce: "AAABoZ/RpNoPXmyGFCEWPhy8OwvLPmyTUBkmfGlTt7o=".to_string(),
    recipient: "huggies.near".to_string(),
  }
}
// ========================================
// --- TESTS -----------------------------
#[test]
fn a_real_near_kit_signature_verifies() {
    assert_eq!(nep413_verify_fun(&fixture_fun()), Ok(()));
}

#[test]
fn a_changed_message_is_rejected() {
    let mut signed = fixture_fun();
    signed.message = "I verify I own every account.".to_string();
    assert_eq!(
        nep413_verify_fun(&signed),
        Err(NEP413_VERIFY_ERROR::SignatureMismatch)
    );
}

#[test]
fn a_changed_recipient_is_rejected() {
    let mut signed = fixture_fun();
    signed.recipient = "someone-else.near".to_string();
    assert_eq!(
        nep413_verify_fun(&signed),
        Err(NEP413_VERIFY_ERROR::SignatureMismatch)
    );
}

#[test]
fn a_changed_nonce_is_rejected() {
    let mut signed = fixture_fun();
    // a different 32-byte nonce: same length, different bytes.
    signed.nonce = "AQABoZ/RpNoPXmyGFCEWPhy8OwvLPmyTUBkmfGlTt7o=".to_string();
    assert_eq!(
        nep413_verify_fun(&signed),
        Err(NEP413_VERIFY_ERROR::SignatureMismatch)
    );
}

#[test]
fn another_accounts_signature_is_rejected() {
    // a signature is bound to the key that made it. a different public key
    // must not verify, or anybody could hand us someone else's signature.
    let mut signed = fixture_fun();
    signed.public_key = "ed25519:7t8yM4F3YqTFqQ2n3HqGhKQ1m9xRQHqCEHhqKQ9zKqP".to_string();
    assert_eq!(
        nep413_verify_fun(&signed),
        Err(NEP413_VERIFY_ERROR::SignatureMismatch)
    );
}

#[test]
fn a_malformed_nonce_is_rejected() {
    let mut signed = fixture_fun();
    signed.nonce = "AAAA".to_string();
    assert_eq!(
        nep413_verify_fun(&signed),
        Err(NEP413_VERIFY_ERROR::MalformedNonce)
    );
}

#[test]
fn a_malformed_public_key_is_rejected() {
    let mut signed = fixture_fun();
    signed.public_key = "not-a-key".to_string();
    assert_eq!(
        nep413_verify_fun(&signed),
        Err(NEP413_VERIFY_ERROR::MalformedPublicKey)
    );
}

#[test]
fn a_malformed_signature_is_rejected() {
    let mut signed = fixture_fun();
    signed.signature = "not-a-signature".to_string();
    assert_eq!(
        nep413_verify_fun(&signed),
        Err(NEP413_VERIFY_ERROR::MalformedSignature)
    );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
