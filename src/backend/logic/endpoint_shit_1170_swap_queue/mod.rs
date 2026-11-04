// ========================================
// ENDPOINT_SHIT_1170_SWAP_QUEUE
// everything that keeps the swap queue: the queued swap, and the
// accounts on it.
//
// it fronts the swap queue routes: `/api/shit-1170/swap-queue` and
// everything under it.
//
// --- WHY --- these live together: a queued swap is TWO levels deep —
// a SWAP and the ACCOUNT ROWS under it. splitting them across folders
// would break one object into two pieces that have to be found
// separately.
//
// --- WHY --- this is NOT MERGED INTO THE TX QUEUE: a queued swap is not
// a queued batch of transactions. the agent does not know the route — it
// knows the token in, the amount in and the token out, and the route is
// worked out at the moment somebody executes it. so the two queues have
// different shapes, different tables and different routes, and the
// shared parts — the api key gate and the NAMING RULE — are used from
// the tx queue's own files rather than copied.
//
// --- WHY --- the status lives ONLY on the account row: a swap is not
// "sent" or "failed" on its own — it is sent BY an account, and each
// account's send is its own on-chain transaction with its own hash and
// its own outcome. two accounts sending the same queued swap produce two
// different on-chain transactions, and either can succeed while the
// other fails.
// ========================================
pub mod swap_queue_accounts_store;
pub mod swap_queue_row_to_json_fun;
pub mod swap_queue_status_fun;
pub mod swap_queue_store;
pub mod swap_queue_uuid_fun;
// ========================================
// copyright 2026 by sleet.near
// ========================================
