// ========================================
// TX_QUEUE_ARGS_FUN
// the `args` column is a json STRING; the wire shape is a json OBJECT.
//
// --- WHY --- this is its own file: the conversion lives in ONE place, so
// the two directions can never disagree. if the write path built the
// column one way and the read path parsed it another way, the queue would
// come back with its arguments mangled and nobody would know where.
//
// --- WHY --- the column is TEXT and not sqlite's json type: sqlite's
// json functions are an extension that is not in every build, and the
// column is only ever read back as a whole. a TEXT column holds the
// bytes exactly as they were written, and the json is checked by serde.
//
// --- WHY --- the string written to the column is COMPACT: the column
// holds the args of a batch of up to fifty transactions, and whitespace
// would make the rows bigger for nothing. the value is read back into a
// json value, and a json value does not remember its whitespace.
use serde_json::Value;
// ========================================
// --- TO JSON ---------------------------
// the column's string as a json value.
//
// --- WHY --- an error and not a default: an args blob that will not parse
// is a bug or a corrupted row, and quietly replacing it with an empty
// object would hide a call whose arguments are gone. the caller turns
// the error into a 400 or a 500.
//
// --- WHY --- the value is NOT checked for being an object here: the
// column holds whatever was written, and the read path reports what it
// found. the "it must be an object" rule belongs to the request, where
// the caller is still around to be told.
pub fn tx_queue_args_to_json_fun(args_json: &str) -> Result<Value, serde_json::Error> {
    serde_json::from_str(args_json)
}

// ========================================
// --- FROM JSON -------------------------
// a json value as the column's string.
//
// --- WHY --- it is SERIALIZED and not stringified by hand: the column
// has to hold valid json, and hand building it would mean escaping the
// strings by hand and getting it wrong.
//
// --- WHY --- the value is NOT checked for being an object here either:
// same reason as the other direction — the shape is the request's rule,
// and this file only moves the bytes.
pub fn tx_queue_args_from_json_fun(value: &Value) -> Result<String, serde_json::Error> {
    serde_json::to_string(value)
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
