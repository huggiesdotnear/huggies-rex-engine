// ========================================
// SESSION_KEY_FUN
// make a session key, and hash it for the lookup.
//
// the key is what a request carries to prove which account it is for. it
// is a bearer token: whoever holds it IS that account, so it has to be
// unguessable.
//
// --- WHY --- 32 random bytes from the OS, hex encoded: 32 bytes is
// 256 bits of entropy, which is far past anything guessable, and the OS
// randomness is what `rand` reads.
//
// --- WHY --- hex and not base64: a hex key is safe to paste, to put in
// a url, and to read out loud. base64 has `+`, `/` and `=` in it, and
// those break a url query string.
//
// --- WHY --- the key is stored in the db AS IT IS and not encrypted:
// the key is ours, the db is ours, and the key guards nothing that acts
// as the user yet — the one route that reads it gives the caller their
// own account id back. so encrypting it would cost a secret that must
// never change, for a db file that would hold a list of account ids and
// a credential for one read-only route.
//
// --- WHY --- the key's HASH is stored beside it: a request is looked up
// by the hash, so the read path never has to touch the key itself.
//
// --- WHY --- sha-256 and not a slow password hash: the key is 256 bits
// of entropy, not a human-chosen secret, so there is nothing to
// brute-force and a slow hash would only add latency to every request.
use rand::Rng;
use sha2::{Digest, Sha256};
// ========================================
// --- CONFIG -----------------------------
// how many random bytes a key carries.
const HUGGIES_SESSION_KEY_BYTES: usize = 32;
// the prefix every NEW key carries.
//
// --- WHY --- a prefix and not nothing: a key that is obviously ours is
// spotted before it is pasted into the wrong box, and a key that shows
// up in a log or a screenshot is recognisable as one of ours. it is
// BRANDING, not security — the string is known to everybody, so it
// adds no entropy and protects nothing.
//
// --- WHY --- underscores and not dashes or dots: the key travels in a
// header and can end up in a url, and `_` is safe in both, where a `.`
// would look like a file extension.
//
// --- WHY --- only NEW keys get it: the prefix is added where the key
// is MADE, and a key that already exists is handed back as it is. an
// existing key keeps working because the READ path hashes the whole
// key, prefix and all — the db is looked up by that hash, so a key of
// either shape finds its account.
const HUGGIES_SESSION_KEY_PREFIX: &str = "shit_1170_";
// ========================================
// --- GENERATE ---------------------------
// a fresh session key, hex encoded, with the prefix on the front.
//
// --- WHY --- the prefix goes on the FRONT: the reader copies the key
// from the top of the string, and the prefix is the part that says who
// the key belongs to.
pub fn session_key_generate_fun() -> String {
    let mut bytes = [0u8; HUGGIES_SESSION_KEY_BYTES];
    rand::rng().fill_bytes(&mut bytes);
    format!("{}{}", HUGGIES_SESSION_KEY_PREFIX, hex::encode(bytes))
}
// ========================================
// --- HASH -------------------------------
// the hash of a key, as stored next to it.
//
// --- WHY --- the hash is stored as well as the key: a request arrives
// carrying the key, and the lookup is by hash, so the lookup does not
// have to compare against every row's key.
pub fn session_key_hash_fun(session_key: &str) -> String {
    let digest = Sha256::digest(session_key.as_bytes());
    hex::encode(digest)
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
