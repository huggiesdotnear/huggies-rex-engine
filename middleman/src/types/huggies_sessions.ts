// ========================================
// HUGGIES_SESSIONS
// the shapes of our own sessions route, POST /api/huggies/sessions.
//
// the route turns signed messages into a session key: the browser sends
// every account it holds a signature for, and the backend answers with
// the ONE key the user has.
//
// --- WHY --- the fields are camelCase: they mirror the browser's own
// session object (`accountId`, `publicKey`), so the same names run all
// the way from the wallet to the db.
// ========================================

// one account's signed message, as the browser sends it.
//
// --- WHY --- the signature is here and not the account's private key:
// a NEP-413 signature is made by the wallet, which keeps the private
// key. the app only ever holds the public key and the signature, and
// neither can sign anything.
export interface HUGGIES_SIGNED_ACCOUNT {
  accountId: string;
  publicKey: string;
  signature: string;
  message: string;
  nonce: string;
  recipient: string;
}

// the request body.
export interface HUGGIES_SESSIONS_REQUEST {
  // every account the browser holds a signature for.
  accounts: HUGGIES_SIGNED_ACCOUNT[];
}

// the answer: the one session key, and the accounts it belongs to.
export interface HUGGIES_SESSIONS_RESPONSE {
  // the session key. it is sent once, when it is made, and the browser
  // keeps it. a later sign-in from another device gets the SAME key
  // back — a user has exactly one key, whatever device they use.
  sessionKey: string;
  // the user the session belongs to.
  userId: string;
  // every account the user holds signed in.
  accounts: string[];
  // true when this call created the session, false when it already
  // existed and the same key was handed back.
  created: boolean;
}
// ========================================
// copyright 2026 by sleet.near
