// ========================================
// typed token metadata and indexed-holder records for token pages.
// ========================================
export interface HUGGIES_TOKEN_DETAIL {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon: string | null;
  price_usd: number;
  reputation: string;
  holders: number;
  liquidity_usd: number;
  market_cap_usd: number;
  socials: Record<string, string>;
  description: string | null;
  main_pool: string | null;
  main_pool_url: string | null;
}
export interface HUGGIES_TOKEN_HOLDER {
  account_id: string;
  balance: string;
}
export interface HUGGIES_TOKEN_HOLDERS_PAGE {
  rows: HUGGIES_TOKEN_HOLDER[];
  total: number;
  next_cursor: string | null;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
