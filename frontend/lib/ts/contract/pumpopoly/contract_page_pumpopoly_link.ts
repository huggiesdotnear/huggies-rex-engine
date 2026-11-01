// ========================================
// pumpopoly page: the huggies invite link.
//
// the page's `?id=` is read through the shared
// lib/ts/page_account_id.ts, not from here.
// ========================================

// ========================================
// the invite code this app signs players up with. it is this app's own
// account, not a Pumpopoly contract: pumpopoly reads it as the account
// that gets the referral.
export const HUGGIES_PUMPOPOLY_INVITE_ACCOUNT = "huggies.near";
// ========================================
// the Pumpopoly play url, carrying an invite code for an account.
export function pumpopoly_invite_link_fun(account_id: string): string {
  return `https://near.pumpopoly.com/?invite=${encodeURIComponent(account_id)}`;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
