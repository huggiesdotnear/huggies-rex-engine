// ========================================
// pumpopoly page: the account id in the url and the huggies invite link.
// ========================================

// ========================================
// the Pumpopoly contract this app signs players up through.
export const HUGGIES_PUMPOPOLY_INVITE_ACCOUNT = "huggies.near";
// ========================================
// the Pumpopoly play url, carrying an invite code for an account.
export function pumpopoly_invite_link_fun(account_id: string): string {
  return `https://near.pumpopoly.com/?invite=${encodeURIComponent(account_id)}`;
}
// ========================================
// read the `?id=` account id off the page url.
export function pumpopoly_account_id_from_url_fun(): string | null {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("id");
  if (id === null) return null;
  const trimmed = id.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
