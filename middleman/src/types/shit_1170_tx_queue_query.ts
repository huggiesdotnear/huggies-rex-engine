// ========================================
// SHIT_1170_TX_QUEUE_QUERY
// the filters our GET /api/shit-1170/tx-queue route takes.
//
// --- WHY --- the field names are snake_case here and NOT renamed to
// camelCase: the wire names are the ones the api docs and the backend
// use — `account_id`, `hide_sent`, `contract_id`, `method`, `limit` and
// `cursor`. `serde_urlencoded` matches the query key literally, so a
// camelCase name here would be silently ignored by the route.
//
// --- WHY --- `account_id` and `contract_id` are COMMA SEPARATED STRINGS
// and not arrays: the query extractor reads ONE value per param, so a
// list would need the param to be repeated, and a browser cannot build
// a repeated param out of a map. one comma separated string carries
// many values, and it reads the same in a hand-written url. a single
// value still works — "alice.near" is a list of one.
//
// --- WHY --- there is no `status` filter: the status is per account
// and per transaction, and a queue has no global status to filter on.
//
// --- WHY --- `hide_sent` is about ONE account and never about
// everybody: "has this account sent it" is a question about one
// account, because a queue can be sent by alice and not by bob. so it
// needs the account it is about, and the backend answers a 400 when it
// is given without one.
// ========================================

export interface SHIT_1170_TX_QUEUE_QUERY {
  // only the queues these accounts are on. comma separated.
  account_id?: string;
  // with the account, drop the queues this account has already sent.
  // it needs `account_id`.
  //
  // --- WHY --- it is a boolean and not a string here: the backend
  // reads the words AND the digits, so `true` and `1` both work on the
  // wire. the middleman sends the word, which is the readable one, and
  // the backend turns it into the bool the store wants.
  hide_sent?: boolean;
  // only the queues holding a transaction for one of these contracts.
  // comma separated.
  contract_id?: string;
  // only the queues holding a transaction for this method.
  method?: string;
  // how many to return. the backend's default is 50.
  limit?: number;
  // where the page starts. it is the `nextCursor` of the previous page,
  // handed back exactly as it was given.
  //
  // --- WHY --- it is a CURSOR and not an OFFSET: new batches land at
  // the top of the list all the time, so "skip the first N rows" would
  // show the reader the same batch twice or skip one. the cursor says
  // "the rows after THIS one", and that stays true whatever lands
  // above it.
  //
  // --- WHY --- it is an OPAQUE STRING and not something we build: the
  // backend encodes the page point and only the backend can read it
  // back. a cursor we shaped would break the day the backend changes
  // the order.
  cursor?: string;
}

// the params the two stats routes take.
//
// --- WHY --- a separate type and not a field on the list query: the
// stats routes read one param and know nothing of the account, the
// contract or the method. one type per route keeps each route's
// surface exactly what that route accepts.
export interface SHIT_1170_TX_QUEUE_STATS_QUERY {
  // how many rows the answer carries. the backend's default is 20.
  limit?: number;
}

// the params the facets route takes.
//
// --- WHY --- a separate type and not a field on the list query: the
// facets route reads one param and answers with the contracts and the
// accounts. one type per route keeps each route's surface exactly what
// that route accepts.
export interface SHIT_1170_TX_QUEUE_FACETS_QUERY {
  // how many contracts and how many accounts. the backend's default is
  // 40.
  limit?: number;
}
// ========================================
// copyright 2026 by sleet.near
