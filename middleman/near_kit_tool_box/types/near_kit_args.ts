// ========================================
// NEAR_KIT_ARGS
// parameter type map for every chain helper exported from this
// folder. each method gets its own slice of the args it consumes,
// mirroring the `*_args` maps of @near-kit-tool-box/fun.
// ========================================

// ========================================
// args of the rhea_ammv2 views.
export interface rhea_ammv2_args {
  // get_pool_shares / get_pool_shares_batch
  pool_id: number;
  pool_ids: number[];
  // generic
  account_id: string;
  token_id: string;
  amount: string;
  from_index: number;
  limit: number;
}

// ========================================
// args of the rhea_dclv2 views.
export interface rhea_dclv2_args {
  account_id: string;
  token_id: string;
  pool_id: string;
  pool_ids: string[];
  from_index: number;
  limit: number;
}

// ========================================
// args of the INTEAR DEX engine views.
export interface intear_dex_engine_args {
  // registered_assets_of
  account_id: string | null;
  dex_id: string | null;
  from_index: number;
  limit: number;
  // dex_view
  method: string;
  args: string;
}

// ========================================
// args of the INTEAR DEX `xyk` sub-dex views.
export interface intear_dex_xyk_args {
  // get_pool_shares
  pool_ids: number[];
  account_id: string;
}
// ========================================
// copyright 2026 by sleet.near
