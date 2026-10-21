// ========================================
// HUGGIES_SIGN_IN_MESSAGES
// the NEP-413 message and recipient used for signing in.
//
// THE MESSAGE IS FIXED ON PURPOSE. a NEP-413 signature only verifies
// if the verifier re-derives the exact same bytes the wallet signed:
// same message, same nonce, same recipient. a fixed message means the
// server only has to know one string; the per-login entropy lives in
// the nonce (see auth_status.ts) instead. picking the message at
// random would still be verifiable, but only if the chosen message is
// persisted alongside the signature and replayed back to the server —
// strictly more moving parts for no security gain.
//
// these strings are also what the user sees in their wallet prompt,
// so they read as plain english rather than as protocol noise.
// ========================================
export const HUGGIES_SIGN_IN_MESSAGE = "Sign in to HUGGIES";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the NEP-413 recipient. this is the "who is asking" field and it is
// hashed into the signed payload, so it MUST be identical on the
// server at verification time. keep it in sync with the backend.
//
// it is not an on-chain account — it is the app's identifier.
export const HUGGIES_SIGN_IN_RECIPIENT = "huggies-rex.near";
// ========================================
// copyright 2026 by sleet.near
// ========================================