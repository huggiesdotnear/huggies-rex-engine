// ========================================
// SHIT_1170_API_KEYS
// the shapes of our own api key routes, under /api/shit-1170/api-keys
// and /api/shit-1170/api-key/*.
//
// the routes turn signed messages into api keys: the browser sends
// every account it holds a signature for, and the backend answers with
// ONE KEY PER ACCOUNT.
//
// --- WHY --- the fields are camelCase: they mirror the browser's own
// session object (`accountId`, `publicKey`), so the same names run all
// the way from the wallet to the db.
//
// --- WHY --- the key is called `apiKey` and not `sessionKey`: the
// credential in it is not a browser session. the user signs in once and
// hands the key to an agent, and the agent holds it as a bearer token
// for as long as it lives. a "session" describes the browser's short use
// of it; an "api key" describes what it actually is.
// ========================================

// one account's signed message, as the browser sends it.
//
// --- WHY --- the signature is here and not the account's private key:
// a NEP-413 signature is made by the wallet, which keeps the private
// key. the app only ever holds the public key and the signature, and
// neither can sign anything.
export interface SHIT_1170_SIGNED_ACCOUNT {
  accountId: string;
  publicKey: string;
  signature: string;
  message: string;
  nonce: string;
  recipient: string;
}

// the request body.
export interface SHIT_1170_API_KEYS_REQUEST {
  // every account the browser holds a signature for.
  accounts: SHIT_1170_SIGNED_ACCOUNT[];
}

// one account's api key.
export interface SHIT_1170_API_KEY {
  // the account the key belongs to.
  accountId: string;
  // the api key. it is sent once, when it is made, and the browser
  // keeps it. a later sign-in from another device gets the SAME key
  // back — an account has exactly one key, whatever device it signs in
  // from.
  apiKey: string;
  // true when this call made the key, false when it already existed
  // and the same key was handed back.
  created: boolean;
}

// the answer to the api-keys route: one entry per account.
export interface SHIT_1170_API_KEYS_RESPONSE {
  keys: SHIT_1170_API_KEY[];
}

// the answer to the api-key/me route: the one account the key belongs
// to.
export interface SHIT_1170_API_KEY_ME {
  accountId: string;
  createdAt: number;
  updatedAt: number;
}
// ========================================
// copyright 2026 by sleet.near
