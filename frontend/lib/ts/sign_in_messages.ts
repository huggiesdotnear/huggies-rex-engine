// ========================================
// HUGGIES_SIGN_IN_MESSAGES
// the NEP-413 message and the session phrase used for signing in.
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
// ========================================
// --- CONFIG -----------------------------
// the NEP-413 recipient. this is the "who is asking" field and it is
// hashed into the signed payload, so it MUST be identical on the
// server at verification time. keep it in sync with the backend.
//
// it is not an on-chain account — it is the app's identifier.
export const HUGGIES_SIGN_IN_RECIPIENT = "huggies-rex.near";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// session_phrase_fun — a short human-readable phrase shown in the
// wallet prompt next to the message, so a user can eyeball that
// they are signing into HUGGIES and not some other site.
//
// PHRASES is deliberately separate from the NEP-413 message: this
// string is NOT part of the signed payload, so it can vary freely
// without breaking server-side verification. it is logged to the
// console for support/debugging purposes only.
//
// words are chosen to be unambiguous when read aloud and typed back,
// avoiding look-alike characters (no 0/O, 1/l/I).
const HUGGIES_PHRASES: ReadonlyArray<string> = [
  "DIAPER HANDS ONLY",
  "GOLDEN SHIT",
  "THE DIAPER DIARIES",
  "ABSOLUTE UNIT",
  "NEARLY FAMOUS",
  "BABY ON BOARD",
  "RUG PULLER",
  "MAIN CHARACTER",
  "CERTIFIED HUGGER",
  "NO CAPES",
];
// ========================================
// pick_session_phrase_fun — choose one phrase at random. Math.random
// is fine here: the phrase carries no security weight, it is only a
// human-readable confirmation aid.
function pick_session_phrase_fun(): string {
  const COUNT = HUGGIES_PHRASES.length;
  if (COUNT === 0) return "CERTIFIED HUGGER";
  return HUGGIES_PHRASES[Math.floor(Math.random() * COUNT)];
}
// ========================================
// pick_session_phrase_fun — exported so auth_status.ts can draw the
// phrase that accompanies a sign-in. it stays a function rather than a
// constant so every sign-in gets a fresh pick.
// ========================================
export { pick_session_phrase_fun };
// ========================================
// copyright 2026 by sleet.near
// ========================================