// ========================================
// typed shapes returned by the INTEAR DEX `xyk` sub-dex views.
//
// mirrors the `intear_dex_xyk_types` of @near-kit-tool-box/fun so the
// local stand-in and the published package agree on the names.
//
// the xyk dex is a constant-product (x*y=k) amm with two assets per
// pool. its views are read through the engine's `dex_view`, which
// carries **borsh** payloads, so these types describe the decoded
// borsh values.
//
// pool kinds, as reported by the decoded `PoolView`:
//   - `private`   — a single-owner pool
//   - `public`    — a shared pool with LP shares
//   - `launch`    — a token-launch pool quoted in NEAR
//   - `launch_v2` — a token-launch pool with an arbitrary quote asset
// ========================================

// ========================================
// one asset of a pool, with its inner balance.
export interface INTEAR_DEX_XYK_ASSET_WITH_BALANCE_TYPE {
  asset_id: string;
  balance: string;
}

// ========================================
// the pools of a dex, as the decoded `PoolView` describes them.
export interface INTEAR_DEX_XYK_POOL_VIEW_TYPE {
  kind: string;
  assets: INTEAR_DEX_XYK_ASSET_WITH_BALANCE_TYPE[];
  total_shares: string | null;
}

// ========================================
// the LP share of one account in one pool.
//
// the xyk dex answers with one `Option` per pool:
//   - `null`        — the pool is not a public pool, so it has no
//                     per-account share map at all
//   - `"0"`         — the account is registered but holds nothing
//   - `"123456"`    — the account holds that many shares
export interface INTEAR_DEX_XYK_POOL_SHARE_TYPE {
  shares: string | null;
}

// ========================================
// the LP shares of one account across a list of pools, in the order
// the pools were asked for.
export type INTEAR_DEX_XYK_POOL_SHARES_TYPE = INTEAR_DEX_XYK_POOL_SHARE_TYPE[];
// ========================================
// copyright 2026 by sleet.near
