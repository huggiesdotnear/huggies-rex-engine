// ========================================
// data loader for the INTEAR DEX engine contract page.
// ========================================
import { contract_view_fun } from "./contract_view";
import { read_intear_pool_views_fun } from "./intear_borsh";
import { read_option_u128_vec_fun } from "./intear_dex_borsh";
import type { HUGGIES_INTEAR_POOL_VIEW } from "./intear_borsh";
// ========================================
export interface HUGGIES_INTEAR_ASSET {
  asset_id: string;
  balance: string;
}
export interface HUGGIES_INTEAR_DATA {
  pools: HUGGIES_INTEAR_POOL_VIEW[];
  assets: HUGGIES_INTEAR_ASSET[];
  shares: Array<string | null>;
  errors: string[];
}
// ========================================
const HUGGIES_INTEAR_SHARE_BATCH_LIMIT = 100;
const HUGGIES_INTEAR_POOL_LIMIT = 71;
// ========================================
// encode one unsigned 32-bit little-endian Borsh integer.
function encode_u32_fun(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}
// ========================================
// encode a Borsh vector of u32 pool ids.
function encode_pool_ids_fun(pool_ids: number[]): Uint8Array {
  const bytes = new Uint8Array(4 + pool_ids.length * 4);
  new DataView(bytes.buffer).setUint32(0, pool_ids.length, true);
  pool_ids.forEach((pool_id, index) => {
    new DataView(bytes.buffer).setUint32(4 + index * 4, pool_id, true);
  });
  return bytes;
}
// ========================================
// encode a Borsh length-prefixed account id.
function encode_string_fun(value: string): Uint8Array {
  const encoded = new TextEncoder().encode(value);
  const bytes = new Uint8Array(4 + encoded.length);
  new DataView(bytes.buffer).setUint32(0, encoded.length, true);
  bytes.set(encoded, 4);
  return bytes;
}
// ========================================
// encode Borsh get_pool_shares arguments.
function encode_pool_shares_fun(
  pool_ids: number[],
  account_id: string,
): Uint8Array {
  const ids = encode_pool_ids_fun(pool_ids);
  const account = encode_string_fun(account_id);
  const bytes = new Uint8Array(ids.length + account.length);
  bytes.set(ids);
  bytes.set(account, ids.length);
  return bytes;
}
// ========================================
// decode a base64 NEAR view response into bytes.
function decode_base64_fun(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
// ========================================
// decode the JSON-string-wrapped base64 returned by dex_view.
function decode_dex_view_fun(value: string): Uint8Array {
  let encoded = value;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === "string") encoded = parsed;
  } catch {
    // Some RPC clients unwrap the JSON string before returning it.
  }
  return decode_base64_fun(encoded);
}
// ========================================
// parse registered assets returned as asset id and balance tuples.
function parse_registered_assets_fun(value: unknown): HUGGIES_INTEAR_ASSET[] {
  if (!Array.isArray(value)) return [];
  const assets: HUGGIES_INTEAR_ASSET[] = [];
  for (const row of value) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const asset_id = row[0];
    const balance = row[1];
    if (typeof asset_id !== "string" || typeof balance !== "string") continue;
    assets.push({ asset_id, balance });
  }
  return assets;
}
// ========================================
// load live XYK pools, registered account assets, and LP shares.
export async function load_intear_dex_page_fun(
  account_id: string | null,
): Promise<HUGGIES_INTEAR_DATA> {
  const contract_id = "dex.intear.near";
  const dex_id = "slimedragon.near/xyk";
  const errors: string[] = [];
  let pools: HUGGIES_INTEAR_POOL_VIEW[] = [];
  let assets: HUGGIES_INTEAR_ASSET[] = [];
  let shares: Array<string | null> = [];

  try {
    const start_index = encode_u32_fun(0);
    const limit = encode_u32_fun(HUGGIES_INTEAR_POOL_LIMIT);
    const pool_args = new Uint8Array(start_index.length + limit.length);
    pool_args.set(start_index);
    pool_args.set(limit, start_index.length);
    const raw = await contract_view_fun<string>(contract_id, "dex_view", {
      dex_id,
      method: "get_pools",
      args: btoa(String.fromCharCode(...pool_args)),
    });
    pools = read_intear_pool_views_fun(decode_dex_view_fun(raw), 0).value;
  } catch (err) {
    errors.push(`pools: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (account_id !== null) {
    try {
      assets = parse_registered_assets_fun(
        await contract_view_fun<unknown>(contract_id, "registered_assets_of", {
          account_id,
          from_index: 0,
          limit: 500,
        }),
      );
    } catch (err) {
      errors.push(
        `assets: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    try {
      const pool_ids = pools.map((_pool, index) => index);
      for (
        let offset = 0;
        offset < pool_ids.length;
        offset += HUGGIES_INTEAR_SHARE_BATCH_LIMIT
      ) {
        const batch = pool_ids.slice(
          offset,
          offset + HUGGIES_INTEAR_SHARE_BATCH_LIMIT,
        );
        const raw = await contract_view_fun<string>(contract_id, "dex_view", {
          dex_id,
          method: "get_pool_shares",
          args: btoa(
            String.fromCharCode(...encode_pool_shares_fun(batch, account_id)),
          ),
        });
        const bytes = decode_dex_view_fun(raw);
        const values = read_option_u128_vec_fun(bytes);
        shares.push(...values);
      }
    } catch (err) {
      errors.push(
        `shares: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return { pools, assets, shares, errors };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
