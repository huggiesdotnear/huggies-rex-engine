// ========================================
// the message + recipient the wallet signs during sign-in. both are
// part of the signed payload, so a stored session can only be
// verified against the exact pair that was signed — changing either
// invalidates every session already in localStorage.
// ========================================
export const HUGGIES_SIGN_IN_MESSAGE =
  "I verify I have diaper hands and own this NEAR account.";
// ========================================
export const HUGGIES_SIGN_IN_RECIPIENT = "huggies.near";
// ========================================
// copyright 2026 by sleet.near
// ========================================
