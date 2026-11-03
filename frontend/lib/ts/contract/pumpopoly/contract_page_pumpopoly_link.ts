// ========================================
// pumpopoly page: the shit-1170 invite link.
//
// the page's `?id=` is read through the shared
// lib/ts/contract/pumpopoly/contract_page_pumpopoly_account_id.ts, not from here.
// ========================================

// ========================================
// the invite code this app signs players up with. it is this app's own
// account, not a Pumpopoly contract: pumpopoly reads it as the account
// that gets the referral.
export const SHIT_1170_PUMPOPOLY_INVITE_ACCOUNT = "huggies.near";
// ========================================
// the Pumpopoly play url, carrying an invite code for an account.
export function pumpopoly_invite_link_fun(account_id: string): string {
  return `https://near.pumpopoly.com/?invite=${encodeURIComponent(account_id)}`;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
