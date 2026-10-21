// ========================================
// HUGGIES_SIGN_IN_MESSAGES
// ========================================
// the message the user signs in their wallet prompt.
export const HUGGIES_SIGN_IN_MESSAGE = "I verify I have diaper hands and own this NEAR account.";
// ========================================
// the NEP-413 recipient. hashed into the signed payload, so the
// server MUST verify against the value STORED in each session
// (set at sign-in time) rather than this constant — drifting it
// here would silently invalidate every prior session.
export const HUGGIES_SIGN_IN_RECIPIENT = "huggies.near";
// ========================================
// copyright 2026 by sleet.near
// ========================================