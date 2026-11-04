// ========================================
// TX_QUEUE_UUID_FUN
// the id maker for the queue and for the transactions inside it.
//
// --- WHY --- the ids are uuids and not integers: the id goes into a url
// that a user pastes and an agent quotes back. a uuid does not tell
// anybody how many queues exist, and it cannot be guessed to read
// somebody else's queue.
//
// --- WHY --- `tx_id` is a uuid and not `queue_id` + `position`: the
// position is renumbered when a transaction is removed from the middle of
// the batch. a url that named a transaction by its position would then
// point at a different transaction. the uuid does not move.
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
// ========================================
use uuid::Uuid;
// ========================================
// --- GENERATE ---------------------------
// a fresh uuid v4, lowercase and hyphenated.
//
// --- WHY --- it is lowercased: the id is compared as a string in urls,
// in the db and in tests, and a mixed case id would make two spellings of
// the same queue.
pub fn tx_queue_uuid_fun() -> String {
    Uuid::new_v4().to_string()
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
