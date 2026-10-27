// ========================================
// the shape of one token row in the discover list.
//
// it lives on its own because three files need it: the list fetch, the
// search fetch and the order. a type shared through an import cycle
// is worse than a type with a home.
// ========================================

// ========================================
// --- SHAPE ------------------------------
// one token as the discover list shows it.
//
// `icon` is filled in separately — it is a full base64 data uri and is
// fetched only for the rows on screen, then cached durably.
export interface HUGGIES_TOKEN_SEARCH_RESULT {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon: string | null;
  price_usd: number;
  reputation: string;
  holders: number;
  volume_usd_24h: number;
  market_cap_usd: number;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
