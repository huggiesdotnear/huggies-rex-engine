// ========================================
// SWAP_QUEUE_CURSOR_FUN
// the cursor of the swap list: an opaque token that says "the page
// after this one".
//
// --- WHY --- THE SWAPS HAVE THEIR OWN CURSOR AND NOT THE TX ONE: the
// two lists are two resources with two tables, and each one has its own
// id column. a shared cursor would have to carry a flag saying which
// table it belonged to, and one token shape that means two things is a
// token shape that can be read wrongly.
//
// --- WHY --- IT WORKS EXACTLY LIKE THE TX CURSOR: the swap list is
// ordered by `created_at DESC` too, and the same problem comes with it —
// new swaps land at the top all the time, so an offset would show the
// reader the same swap twice. the cursor says "the swaps after THIS
// one", and that stays true whatever lands above it.
//
// --- WHY --- THE PAIR AND NOT JUST THE TIMESTAMP: many swaps can be
// queued in the same millisecond, and `created_at` alone would leave
// the cursor ambiguous. the `swap_id` breaks the tie.
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
// ========================================
// --- TYPES ------------------------------
// where one page starts.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SWAP_QUEUE_CURSOR {
    // the `created_at` of the last row of the page before.
    pub created_at: i64,
    // the id of that same row. it breaks the tie between two rows that
    // share a `created_at`.
    pub swap_id: String,
}
// ========================================
// --- ENCODE ----------------------------
// the cursor of the page that starts after this row.
//
// --- WHY --- IT IS THE LAST ROW AND NOT THE FIRST: the cursor is handed
// out AFTER the page has been read, and the last row of that page is
// the one the next page starts after. the first row would make the
// reader see it twice.
pub fn swap_queue_cursor_encode_fun(created_at: i64, swap_id: &str) -> String {
    let raw = format!("{created_at}:{swap_id}");
    URL_SAFE_NO_PAD.encode(raw.as_bytes())
}
// ========================================
// --- DECODE ----------------------------
// the cursor, read back.
//
// --- WHY --- A BAD CURSOR IS AN ERROR AND NOT AN EMPTY CURSOR: a
// cursor the api cannot read means the caller sent something the api
// does not understand. answering with the FIRST page and pretending it
// was the page that was asked for would show the reader the same rows
// twice and hide the fact that their paging was broken. the route turns
// this error into a 400.
pub fn swap_queue_cursor_decode_fun(raw: &str) -> Result<SWAP_QUEUE_CURSOR, String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err("the cursor is empty".to_string());
    }
    let bytes = match URL_SAFE_NO_PAD.decode(trimmed) {
        Ok(bytes) => bytes,
        Err(_) => return Err("the cursor is not a cursor this api made".to_string()),
    };
    let text = match String::from_utf8(bytes) {
        Ok(text) => text,
        Err(_) => return Err("the cursor is not text".to_string()),
    };
    let (created_at, swap_id) = match text.split_once(':') {
        Some(pair) => pair,
        None => return Err("the cursor is not a cursor this api made".to_string()),
    };
    let created_at = match created_at.trim().parse::<i64>() {
        Ok(value) => value,
        Err(_) => return Err("the cursor carries no time".to_string()),
    };
    let swap_id = swap_id.trim();
    if swap_id.is_empty() {
        return Err("the cursor carries no id".to_string());
    }
    Ok(SWAP_QUEUE_CURSOR {
        created_at,
        swap_id: swap_id.to_string(),
    })
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
