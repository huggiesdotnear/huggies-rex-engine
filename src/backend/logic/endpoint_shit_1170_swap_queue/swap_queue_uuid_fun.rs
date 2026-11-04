// ========================================
// SWAP_QUEUE_UUID_FUN
// the id maker for the queued swaps.
//
// --- WHY --- the id is a uuid and not an integer: the id goes into a url
// that a user pastes and an agent quotes back. a uuid does not tell
// anybody how many swaps exist, and it cannot be guessed to read
// somebody else's swap.
//
// --- WHY --- v4 and not v1: v4 is random, so the id does not leak when
// it was made or how many there were before it. v1 is a timestamp plus a
// node id, and a timestamp in the url is a fact about the server's clock
// that nobody needs.
//
// --- WHY --- the crate does the formatting: the version and variant bits
// of a v4 uuid are set in specific places of a specific byte, and a hand
// rolled version that sets them wrong produces an id that is not a uuid
// at all. the crate is the one place that knows the bits.
use uuid::Uuid;
// ========================================
// --- GENERATE ---------------------------
// a fresh uuid v4, lowercase and hyphenated.
//
// --- WHY --- it is lowercased: the id is compared as a string in urls,
// in the db and in tests, and a mixed case id would make two spellings of
// the same swap.
pub fn swap_queue_uuid_fun() -> String {
    Uuid::new_v4().to_string()
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
