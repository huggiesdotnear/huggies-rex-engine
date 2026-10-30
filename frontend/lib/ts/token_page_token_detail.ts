// ========================================
// typed token metadata and indexed-holder records for the token page.
//
// the metadata record carries the price and the decimals, so the
// holders table can price a balance without asking for them again.
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
export interface HUGGIES_TOKEN_PAGE_STATE {
  // the token's metadata, or null while it is loading or when the
  // token id is missing.
  detail: HUGGIES_TOKEN_DETAIL | null;
  // the holder rows loaded so far.
  holders: HUGGIES_TOKEN_HOLDER[];
  holder_total: number;
  // the cursor for the next holder page, or null when there is none.
  next_cursor: string | null;
  loading_more: boolean;
  error: string | null;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
