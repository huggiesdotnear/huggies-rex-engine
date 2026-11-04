// ========================================
// SWAP_QUEUE_ROW_TO_JSON_FUN
// the two db rows become ONE wire shape.
//
// a queued swap is TWO levels deep — a SWAP and the ACCOUNT ROWS under
// it — and the wire shape is one flat json object holding both. this
// file is where they are joined.
//
// --- WHY --- this is its own file: the wire shape is written down ONCE.
// the swap route, the one-swap route and the list route all answer with
// the same shape, and if each of them built it by hand one of them
// would eventually build it differently. the db rows are snake_case and
// the wire is camelCase, and the rename happens here.
//
// --- WHY --- the swap's `accounts` list is the WHO of the WHOLE SWAP:
// a queued swap is ONE swap, so there is one row per account and the
// list is that list — no union, no dedupe.
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_accounts_store::SWAP_QUEUE_ACCOUNT_ROW;
use crate::backend::logic::endpoint_shit_1170_swap_queue::swap_queue_store::SWAP_QUEUE_ROW;
use crate::backend::types::swap_queue_request::{SWAP_QUEUE_ACCOUNT, SWAP_QUEUE_ITEM};
// ========================================
// --- TO JSON ---------------------------
// the wire shape of one queued swap.
pub fn swap_queue_row_to_json_fun(
    swap: &SWAP_QUEUE_ROW,
    accounts: &[SWAP_QUEUE_ACCOUNT_ROW],
) -> SWAP_QUEUE_ITEM {
    SWAP_QUEUE_ITEM {
        swap_id: swap.swap_id.clone(),
        what: swap.what.clone(),
        when: swap.when_text.clone(),
        why: swap.why.clone(),
        when_at: swap.when_at,
        token_in: swap.token_in.clone(),
        amount_in: swap.amount_in.clone(),
        token_out: swap.token_out.clone(),
        amount_out: swap.amount_out.clone(),
        dex_id: swap.dex_id.clone(),
        accounts: accounts.iter().map(account_to_json_fun).collect(),
        created_at: swap.created_at,
        updated_at: swap.updated_at,
    }
}

// ========================================
// --- HELPERS ----------------------------
// one account row as the wire shape.
fn account_to_json_fun(account: &SWAP_QUEUE_ACCOUNT_ROW) -> SWAP_QUEUE_ACCOUNT {
    SWAP_QUEUE_ACCOUNT {
        account_id: account.account_id.clone(),
        status: account.status.clone(),
        tx_hash: account.tx_hash.clone(),
        amount_out: account.amount_out.clone(),
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
