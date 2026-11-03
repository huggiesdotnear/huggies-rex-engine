// ========================================
// SESSION_KEY_FUN
// make a session key, and protect it at rest.
//
// the key is what a request carries to prove which user it is for. it is
// a bearer token: whoever holds it IS the user, so it has to be
// unguessable, and it has to be comparable without leaking.
//
// --- WHY --- 32 random bytes from the OS, hex encoded: 32 bytes is
// 256 bits of entropy, which is far past anything guessable, and the OS
// randomness is what `rand` reads.
//
// --- WHY --- hex and not base64: a hex key is safe to paste, to put in
// a url, and to read out loud. base64 has `+`, `/` and `=` in it, and
// those break a url query string.
//
// --- WHY --- the key is stored ENCRYPTED and not as a plain hash: a hash
// can VERIFY a key but it cannot GIVE a key back. the user has exactly
// one key, ever — so signing in on a second device has to hand back the
// SAME key, and that means the db has to be able to produce the key
// again. a hash cannot do that.
//
// --- WHY --- the secret is passed IN and not read from the environment
// here: the secret is read ONCE, at startup, and handed down. a function
// that read the environment on every call would be untestable (the
// environment is process-global and `set_var` is unsafe in edition
// 2024) and it would make the secret's lifetime unclear.
//
// --- WHY --- a missing secret is an ERROR and not an empty default: an
// empty secret would mean every deployment shares one encryption key,
// and the db would be decryptable by anyone who read this file.
use aes_gcm::aead::{Aead, Generate, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use rand::Rng;
use sha2::{Digest, Sha256};
// ========================================
// --- CONFIG -----------------------------
// how many random bytes a key carries.
const HUGGIES_SESSION_KEY_BYTES: usize = 32;
// the nonce's length in bytes. it is prepended to the ciphertext.
const HUGGIES_NONCE_BYTES: usize = 12;
// ========================================
// --- GENERATE ---------------------------
// a fresh session key, hex encoded.
pub fn session_key_generate_fun() -> String {
    let mut bytes = [0u8; HUGGIES_SESSION_KEY_BYTES];
    rand::rng().fill_bytes(&mut bytes);
    hex::encode(bytes)
}
// ========================================
// --- HASH -------------------------------
// the hash of a key, as stored next to it.
//
// --- WHY --- the hash is stored as well as the ciphertext: a request
// arrives carrying the key, and the lookup is by hash, so the lookup
// does not have to decrypt every row to find its match.
//
// --- WHY --- sha-256 and not a slow password hash: the key is 256 bits
// of entropy, not a human-chosen secret, so there is nothing to
// brute-force and a slow hash would only add latency to every request.
pub fn session_key_hash_fun(session_key: &str) -> String {
    let digest = Sha256::digest(session_key.as_bytes());
    hex::encode(digest)
}
// ========================================
// --- ENCRYPT ----------------------------
// encrypt a session key for storage.
//
// --- WHY --- the nonce is random per call and stored in front of the
// ciphertext: the same key is encrypted exactly once, but a fixed nonce
// would mean the ciphertext is deterministic, and a deterministic
// ciphertext for a bearer token is a thing worth avoiding.
pub fn session_key_encrypt_fun(secret: &str, session_key: &str) -> Result<String, String> {
    let key = secret_bytes_fun(secret)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|_| "bad aes key".to_string())?;

    let nonce = Nonce::generate();
    let nonce_bytes = nonce.to_vec();

    let ciphertext = cipher
        .encrypt(&nonce, session_key.as_bytes())
        .map_err(|_| "the session key could not be encrypted".to_string())?;

    let mut out = Vec::with_capacity(nonce_bytes.len() + ciphertext.len());
    out.extend_from_slice(&nonce_bytes);
    out.extend_from_slice(&ciphertext);
    Ok(hex::encode(out))
}
// ========================================
// --- DECRYPT ----------------------------
// decrypt a stored session key.
//
// --- WHY --- a failure here is an ERROR and not a None: the ciphertext
// was written by this same code, so it not decrypting means the secret
// changed or the db is damaged. swallowing it would hand out a session
// with no key, and the user would be silently logged out.
pub fn session_key_decrypt_fun(secret: &str, stored: &str) -> Result<String, String> {
    let key = secret_bytes_fun(secret)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|_| "bad aes key".to_string())?;

    let raw =
        hex::decode(stored.trim()).map_err(|_| "the stored session key is not hex".to_string())?;
    if raw.len() <= HUGGIES_NONCE_BYTES {
        return Err("the stored session key is too short".to_string());
    }
    let (nonce_bytes, ciphertext) = raw.split_at(HUGGIES_NONCE_BYTES);
    let nonce = Nonce::try_from(nonce_bytes)
        .map_err(|_| "the stored session key has a bad nonce".to_string())?;
    let plain = cipher
        .decrypt(&nonce, ciphertext)
        .map_err(|_| "the stored session key could not be decrypted".to_string())?;
    String::from_utf8(plain).map_err(|_| "the decrypted session key is not text".to_string())
}
// ========================================
// --- HELPERS ----------------------------
// the secret, turned into a 32-byte aes key.
//
// --- WHY --- the secret is HASHED to make the key: a raw secret of any
// length becomes a fixed 32-byte key, so the secret can be a passphrase
// of any length and still produce a valid aes key.
//
// --- WHY --- the secret's bytes are NOT trimmed here: the caller trims
// it when it reads it, so the same secret always gives the same key.
fn secret_bytes_fun(secret: &str) -> Result<[u8; 32], String> {
    if secret.is_empty() {
        return Err("the session secret is empty".to_string());
    }
    let digest = Sha256::digest(secret.as_bytes());
    let mut key = [0u8; 32];
    key.copy_from_slice(&digest);
    Ok(key)
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
