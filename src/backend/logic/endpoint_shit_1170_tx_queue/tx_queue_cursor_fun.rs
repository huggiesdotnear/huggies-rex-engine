// ========================================
// TX_QUEUE_CURSOR_FUN
// the cursor of the queue list: an opaque token that says "the page
// after this one".
//
// --- WHY --- THE CURSOR EXISTS AND NOT AN OFFSET: an offset says "skip
// the first N rows". the rows are ordered by `created_at DESC`, and new
// batches land at the top of that order all the time — so the first N
// rows of page two are NOT the rows the reader already saw. a cursor
// says "the rows after THIS ONE", and that stays true whatever lands
// above it. a reader scrolling a feed of queued work must not see the
// same batch twice, and must not skip one either.
//
// --- WHY --- THE CURSOR IS OPAQUE: it is base64, and the thing inside it
// is the pair `(created_at, queue_id)`. the caller is not meant to read
// it or write it — it is a token the api hands out and the api takes
// back. if the shape of the sort ever changes, the token changes with
// it and the old token is simply refused.
//
// --- WHY --- THE PAIR AND NOT JUST THE TIMESTAMP: many batches can be
// queued in the same millisecond, and `created_at` alone would then leave
// the cursor ambiguous — the same millisecond would be read twice or
// skipped. the `queue_id` breaks the tie, and the pair is unique.
//
// --- WHY --- THE ORDER IS `(created_at DESC, queue_id DESC)`: the id
// breaks the tie in the SAME direction as the time, so "the rows after
// this one" is one clean comparison and not two.
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
// ========================================
// --- TYPES ------------------------------
// where one page starts.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TX_QUEUE_CURSOR {
    // the `created_at` of the last row of the page before.
    pub created_at: i64,
    // the id of that same row. it breaks the tie between two rows that
    // share a `created_at`.
    pub queue_id: String,
}
// ========================================
// --- ENCODE ----------------------------
// the cursor of the page that starts after this row.
//
// --- WHY --- IT IS THE LAST ROW AND NOT THE FIRST: the cursor is handed
// out AFTER the page has been read, and the last row of that page is
// the one the next page starts after. the first row would make the
// reader see it twice.
//
// --- WHY --- THE PAIR IS WRITTEN AS `created_at:queue_id`: the id is a
// uuid and holds no colon, and the time is a number, so the split is on
// the FIRST colon and there is nothing to escape.
pub fn tx_queue_cursor_encode_fun(created_at: i64, queue_id: &str) -> String {
    let raw = format!("{created_at}:{queue_id}");
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
//
// --- WHY --- THE `queue_id` IS NOT EMPTY: an empty id would sort
// strangely against a real one and the comparison would be a lie.
pub fn tx_queue_cursor_decode_fun(raw: &str) -> Result<TX_QUEUE_CURSOR, String> {
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
    let (created_at, queue_id) = match text.split_once(':') {
        Some(pair) => pair,
        None => return Err("the cursor is not a cursor this api made".to_string()),
    };
    let created_at = match created_at.trim().parse::<i64>() {
        Ok(value) => value,
        Err(_) => return Err("the cursor carries no time".to_string()),
    };
    let queue_id = queue_id.trim();
    if queue_id.is_empty() {
        return Err("the cursor carries no id".to_string());
    }
    Ok(TX_QUEUE_CURSOR {
        created_at,
        queue_id: queue_id.to_string(),
    })
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
