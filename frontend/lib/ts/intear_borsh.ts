// ========================================
// Borsh codecs for the INTEAR DEX XYK views.
// ========================================
import {
  read_option_fun,
  read_string_fun,
  read_u128_fun,
  read_vec_fun,
} from "./borsh_reader";
// ========================================
export interface HUGGIES_INTEAR_ASSET {
  asset_id: string;
  balance: string;
}
export interface HUGGIES_INTEAR_POOL_VIEW {
  kind: string;
  assets: HUGGIES_INTEAR_ASSET[];
  total_shares: string | null;
}
// ========================================
// read an INTEAR AssetId enum into its display form.
export function read_intear_asset_id_fun(
  bytes: Uint8Array,
  offset: number,
): { value: string; offset: number } {
  const tag = bytes[offset];
  if (tag === 0) return { value: "near", offset: offset + 1 };
  if (tag !== 1 && tag !== 2 && tag !== 3) {
    throw new Error(`invalid INTEAR AssetId tag ${tag}`);
  }
  const contract = read_string_fun(bytes, offset + 1);
  if (tag === 1) {
    return { value: `nep141:${contract.value}`, offset: contract.offset };
  }
  const token = read_string_fun(bytes, contract.offset);
  const prefix = tag === 2 ? "nep245" : "nep171";
  return {
    value: `${prefix}:${contract.value}:${token.value}`,
    offset: token.offset,
  };
}
// ========================================
// read an AssetWithBalance struct.
export function read_intear_asset_with_balance_fun(
  bytes: Uint8Array,
  offset: number,
): { value: HUGGIES_INTEAR_ASSET; offset: number } {
  const asset = read_intear_asset_id_fun(bytes, offset);
  const balance = read_u128_fun(bytes, asset.offset);
  return {
    value: { asset_id: asset.value, balance },
    offset: asset.offset + 16,
  };
}
// ========================================
// skip a V1 CurrentFees value containing receiver/fraction pairs.
function skip_current_fees_fun(bytes: Uint8Array, offset: number): number {
  const count = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(offset, true);
  let cursor = offset + 4;
  for (let index = 0; index < count; index += 1) {
    const receiver_tag = bytes[cursor];
    cursor += 1;
    if (receiver_tag === 0 || receiver_tag === 2) {
      cursor = read_string_fun(bytes, cursor).offset;
    } else if (receiver_tag !== 1) {
      throw new Error(`invalid INTEAR FeeReceiver tag ${receiver_tag}`);
    }
    cursor += 4;
  }
  return cursor;
}
// ========================================
// skip a V2 fee configuration value.
function skip_fee_configuration_fun(bytes: Uint8Array, offset: number): number {
  const tag = bytes[offset];
  if (tag === 0) return skip_current_fees_fun(bytes, offset + 1);
  if (tag !== 1) throw new Error(`invalid INTEAR fee configuration tag ${tag}`);
  const count = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(offset + 2, true);
  let cursor = offset + 6;
  // The receiver enum is followed by its account id, then the fee amount.
  // The receiver vector length is encoded after the enum tag.
  // The vector starts at offset + 5 and its first receiver is next.
  for (let index = 0; index < count; index += 1) {
    const receiver_tag = bytes[cursor];
    cursor += 1;
    if (receiver_tag === 0) {
      const account = read_string_fun(bytes, cursor);
      cursor = account.offset;
    } else if (receiver_tag === 2) {
      const account = read_string_fun(bytes, cursor);
      cursor = account.offset;
    } else if (receiver_tag !== 1) {
      throw new Error(`invalid INTEAR FeeReceiver tag ${receiver_tag}`);
    }
    const amount_tag = bytes[cursor];
    cursor += 1;
    if (amount_tag === 0) cursor += 4;
    else if (amount_tag === 1) cursor += 8 + 8 + 1;
    else if (amount_tag === 2) cursor += 8;
    else throw new Error(`invalid INTEAR FeeAmount tag ${amount_tag}`);
  }
  return cursor;
}
// ========================================
// read a Borsh XYK PoolView into the fields needed by the contract page.
export function read_intear_pool_view_fun(
  bytes: Uint8Array,
  offset: number,
): { value: HUGGIES_INTEAR_POOL_VIEW; offset: number } {
  const tag = bytes[offset];
  if (tag > 3) throw new Error(`invalid INTEAR PoolView tag ${tag}`);
  let cursor = offset + 1;
  let assets: HUGGIES_INTEAR_ASSET[] = [];
  let total_shares: string | null = null;

  if (tag === 0 || tag === 1) {
    const first = read_intear_asset_with_balance_fun(bytes, cursor);
    const second = read_intear_asset_with_balance_fun(bytes, first.offset);
    assets = [first.value, second.value];
    cursor = second.offset;
  } else if (tag === 2) {
    const near_amount = read_u128_fun(bytes, cursor);
    const launched = read_intear_asset_with_balance_fun(bytes, cursor + 16);
    assets = [{ asset_id: "near", balance: near_amount }, launched.value];
    cursor = launched.offset + 16;
  } else {
    const quote = read_intear_asset_with_balance_fun(bytes, cursor);
    const launched = read_intear_asset_with_balance_fun(bytes, quote.offset);
    assets = [quote.value, launched.value];
    cursor = launched.offset + 16;
  }

  cursor = skip_current_fees_fun(bytes, cursor);
  cursor = skip_fee_configuration_fun(bytes, cursor);

  if (tag === 0) {
    const owner = read_string_fun(bytes, cursor);
    cursor = owner.offset + 1;
  } else if (tag === 1) {
    const shares = read_option_fun(bytes, cursor, (value, value_offset) => ({
      value: read_u128_fun(value, value_offset),
      offset: value_offset + 16,
    }));
    total_shares = shares.value;
    cursor = shares.offset;
  }

  const kind = ["private", "public", "launch", "launch_v2"][tag] ?? "unknown";
  return { value: { kind, assets, total_shares }, offset: cursor };
}
// ========================================
// read a Borsh vector of XYK pool views.
export function read_intear_pool_views_fun(
  bytes: Uint8Array,
  offset: number,
): { value: HUGGIES_INTEAR_POOL_VIEW[]; offset: number } {
  return read_vec_fun(bytes, offset, read_intear_pool_view_fun);
}
// ========================================
// read a Borsh vector of optional u128 share values.
export function read_intear_share_values_fun(
  bytes: Uint8Array,
  offset: number,
): { value: Array<string | null>; offset: number } {
  return read_vec_fun(bytes, offset, (value, value_offset) =>
    read_option_fun(value, value_offset, (inner, inner_offset) => ({
      value: read_u128_fun(inner, inner_offset),
      offset: inner_offset + 16,
    })),
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
