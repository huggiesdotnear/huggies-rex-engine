// ========================================
// NEAR_KIT_INTEAR_DEX_XYK_DECODE
// borsh decoders for the INTEAR DEX `xyk` sub-dex view responses.
//
// it replaces frontend/lib/ts/intear_borsh.ts, which decoded the same
// shapes with a second, parallel copy of the borsh reader.
//
// the shapes mirror `xyk_dex_types` in the INTEAR DEX source:
//   https://github.com/INTEARnear/dex/tree/main/dexes/xyk/types
// ========================================
import { BorshReader } from "./near_kit_borsh";
import { near_kit_read_intear_dex_asset_id_fun } from "./near_kit_intear_dex_asset_id";
import type {
  INTEAR_DEX_XYK_ASSET_WITH_BALANCE_TYPE,
  INTEAR_DEX_XYK_POOL_VIEW_TYPE,
} from "../types/intear_dex_xyk_types";
// ========================================
// read a `FeeReceiver`.
function near_kit_read_fee_receiver_fun(reader: BorshReader): number {
  const variant = reader.u8();
  if (variant === 0) {
    reader.string();
    return 0;
  }
  if (variant === 1) return 1;
  if (variant === 2) {
    reader.string();
    return 2;
  }
  throw new Error(`intear dex xyk: unknown fee receiver variant ${variant}`);
}

// ========================================
// skip a `CurrentFees` — the pool's fees at the current block.
function near_kit_skip_current_fees_fun(reader: BorshReader): void {
  const count = reader.u32();
  for (let index = 0; index < count; index += 1) {
    near_kit_read_fee_receiver_fun(reader);
    reader.u32();
  }
}

// ========================================
// skip a `FeeAmount` — the v2 per-receiver fee rule.
function near_kit_skip_fee_amount_fun(reader: BorshReader): void {
  const variant = reader.u8();
  if (variant === 0) {
    reader.u32();
    return;
  }
  if (variant === 1) {
    reader.u64();
    reader.u32();
    reader.u64();
    reader.u32();
    reader.u8();
    return;
  }
  if (variant === 2) {
    reader.u32();
    reader.u32();
    return;
  }
  throw new Error(`intear dex xyk: unknown fee amount variant ${variant}`);
}

// ========================================
// skip a `FeeConfiguration`.
function near_kit_skip_fee_configuration_fun(reader: BorshReader): void {
  const variant = reader.u8();
  if (variant === 0) {
    near_kit_skip_current_fees_fun(reader);
    return;
  }
  if (variant === 1) {
    const count = reader.u32();
    for (let index = 0; index < count; index += 1) {
      near_kit_read_fee_receiver_fun(reader);
      near_kit_skip_fee_amount_fun(reader);
    }
    return;
  }
  throw new Error(
    `intear dex xyk: unknown fee configuration variant ${variant}`,
  );
}

// ========================================
// read an `AssetWithBalance`.
function near_kit_read_asset_with_balance_fun(
  reader: BorshReader,
): INTEAR_DEX_XYK_ASSET_WITH_BALANCE_TYPE {
  const asset_id = near_kit_read_intear_dex_asset_id_fun(reader);
  const balance = reader.u128().toString();
  return { asset_id, balance };
}

// ========================================
// read a `PoolView`.
export function near_kit_read_intear_pool_view_fun(
  reader: BorshReader,
): INTEAR_DEX_XYK_POOL_VIEW_TYPE {
  const variant = reader.u8();
  if (variant > 3) {
    throw new Error(`intear dex xyk: unknown pool view variant ${variant}`);
  }
  let assets: INTEAR_DEX_XYK_ASSET_WITH_BALANCE_TYPE[] = [];
  let total_shares: string | null = null;

  if (variant === 0 || variant === 1) {
    assets = [
      near_kit_read_asset_with_balance_fun(reader),
      near_kit_read_asset_with_balance_fun(reader),
    ];
  } else if (variant === 2) {
    const near_amount = reader.u128().toString();
    const launched = near_kit_read_asset_with_balance_fun(reader);
    assets = [{ asset_id: "near", balance: near_amount }, launched];
  } else {
    const quote = near_kit_read_asset_with_balance_fun(reader);
    const launched = near_kit_read_asset_with_balance_fun(reader);
    assets = [quote, launched];
  }

  near_kit_skip_current_fees_fun(reader);
  near_kit_skip_fee_configuration_fun(reader);

  if (variant === 0) {
    reader.string();
    reader.u8();
  } else if (variant === 1) {
    total_shares = reader.option((item) => item.u128().toString());
  }

  const kind =
    ["private", "public", "launch", "launch_v2"][variant] ?? "unknown";
  return { kind, assets, total_shares };
}

// ========================================
// read one element of the `Vec<Option<U128>>` that
// `get_pool_shares` returns.
export function near_kit_read_intear_pool_share_fun(reader: BorshReader): {
  shares: string | null;
} {
  const tag = reader.u8();
  if (tag === 0) return { shares: null };
  if (tag !== 1) throw new Error(`borsh: invalid option tag ${tag}`);
  return { shares: reader.u128().toString() };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
