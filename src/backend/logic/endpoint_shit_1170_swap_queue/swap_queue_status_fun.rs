// ========================================
// SWAP_QUEUE_STATUS_FUN
// the four states an account row can be in.
//
// --- WHY --- THE STATES ARE THE ONES THE TX QUEUE USES: the reader
// sees the same words in the same places — WAITING, SENT, SENT ✓,
// FAILED — and one set of words for one set of states is easier to
// read than two sets that mean almost the same thing.
//
// --- WHY --- this is NOT a derived-status file: nothing here computes a
// status from anything. the status is a COLUMN on the account row, it is
// written when the row is written, and it is read back as it is.
//
// --- WHY --- there is NO swap-level status: a queued swap is never done.
// at any moment another account can decide they want it, and they join.
// a "is this swap done" badge would be a lie the moment somebody new
// signs it.
//
// --- WHY --- there is a `sent` state when the hash is already the fact:
// `sent` means "it went out and we do not know the outcome yet". the
// outcome is not known at the moment the hash is written — the frontend
// reads it off the chain later and reports it back. so `sent` is a real
// state and not a leftover.
// ========================================
// --- STATUS -----------------------------
// on the queue, not signed yet.
pub const SHIT_1170_SWAP_QUEUE_STATUS_PENDING: &str = "pending";

// signed and sent — the outcome is not known yet.
pub const SHIT_1170_SWAP_QUEUE_STATUS_SENT: &str = "sent";

// it went through.
pub const SHIT_1170_SWAP_QUEUE_STATUS_SUCCEEDED: &str = "succeeded";

// it did not work.
pub const SHIT_1170_SWAP_QUEUE_STATUS_FAILED: &str = "failed";
// ========================================
// copyright 2026 by sleet.near
// ========================================
