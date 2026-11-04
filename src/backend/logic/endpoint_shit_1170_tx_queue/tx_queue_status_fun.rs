// ========================================
// TX_QUEUE_STATUS_FUN
// the four states an account row can be in.
//
// --- WHY --- this is NOT a derived-status file: nothing here computes a
// status from anything. the status is a COLUMN on the account row, it is
// written when the row is written, and it is read back as it is. there is
// no rule to write down here, and no level of the queue that can
// disagree with another — the account row's status IS the status.
//
// --- WHY --- there is NO queue-level status: a queue is never done. at
// any moment another account can decide they want to send it, and they
// join. a "is this queue done" badge would be a lie the moment somebody
// new signs it.
//
// --- WHY --- there is NO transaction-level status either: the truth about
// a transaction is that SOME account sent it, and each account's send has
// its own hash and its own outcome. two accounts can send the same queued
// transaction and one can succeed while the other fails, so a single
// status on the transaction would throw away one of the two truths.
//
// --- WHY --- there is a `sent` state when the hash is already the fact:
// `sent` means "it went out and we do not know the outcome yet". the
// outcome is not known at the moment the hash is written — the frontend
// reads it off the chain later and reports it back. so `sent` is a real
// state and not a leftover.
// ========================================
// --- STATUS -----------------------------
// on the queue, not signed yet.
pub const SHIT_1170_TX_QUEUE_STATUS_PENDING: &str = "pending";

// signed and sent — the outcome is not known yet.
pub const SHIT_1170_TX_QUEUE_STATUS_SENT: &str = "sent";

// it went through.
pub const SHIT_1170_TX_QUEUE_STATUS_SUCCEEDED: &str = "succeeded";

// it did not work.
pub const SHIT_1170_TX_QUEUE_STATUS_FAILED: &str = "failed";
// ========================================
// copyright 2026 by sleet.near
// ========================================
