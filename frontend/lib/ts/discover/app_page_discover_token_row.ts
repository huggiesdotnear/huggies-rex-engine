// ========================================
// the shape of one row in the discover token list.
//
// it lives on its own because three files need it: the list fetch, the
// search fetch and the order. a type shared through an import cycle is
// worse than a type with a home.
//
// --- WHY --- IT IS CALLED A ROW AND NOT A SEARCH RESULT: the same shape
// is a row in the token list and a row in the search results — one
// token, with its icon and its balances. naming it after the search
// would make the list look like it borrowed the search's type.
// ========================================

// ========================================
// --- SHAPE ------------------------------
// `icon` is filled in separately — it is a full inline data uri and is
// fetched only for the rows on screen, then cached durably.
export interface HUGGIES_DISCOVER_TOKEN_ROW {
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
