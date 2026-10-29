// ========================================
// NEAR_KIT_INTEAR_DEX_ASSET_ID
// the INTEAR DEX `AssetId` type, in its string form and its borsh
// form.
//
// string form (the form every JSON API of the engine uses):
//   - `near`                            — native NEAR
//   - `nep141:<contract_id>`            — NEP-141 fungible token
//   - `nep245:<contract_id>:<token_id>` — NEP-245 multi-token
//   - `nep171:<contract_id>:<token_id>` — NEP-171 NFT
//
// borsh form (what the sub-dexes read):
//   - `near`            → variant 0
//   - `nep141:<id>`     → variant 1 + String
//   - `nep245:<id>:<t>` → variant 2 + String + String
//   - `nep171:<id>:<t>` → variant 3 + String + String
//
// it replaces frontend/lib/ts/intear_asset_id.ts and
// frontend/lib/ts/intear_asset_token_id.ts, which were the same
// parser split across two files.
// ========================================
import { BorshReader, BorshWriter } from "./near_kit_borsh";
import type { INTEAR_DEX_ASSET_ID_PARSED_TYPE } from "../types/intear_dex_engine_types";
// ========================================
// parse an INTEAR DEX asset id string into its parts.
export function near_kit_parse_intear_dex_asset_id_fun(
  asset_id: string,
): INTEAR_DEX_ASSET_ID_PARSED_TYPE {
  if (asset_id === "near") {
    return { kind: "near", contract_id: null, token_id: null };
  }
  const separator = asset_id.indexOf(":");
  if (separator === -1) {
    throw new Error(
      `intear dex: invalid asset id "${asset_id}" (expected "near", "nep141:<id>", "nep245:<id>:<token>" or "nep171:<id>:<token>")`,
    );
  }
  const prefix = asset_id.slice(0, separator);
  if (prefix === "nep141") {
    const contract_id = asset_id.slice(separator + 1);
    if (contract_id.length === 0) {
      throw new Error(
        `intear dex: invalid asset id "${asset_id}" (missing contract id)`,
      );
    }
    return { kind: "nep141", contract_id, token_id: null };
  }
  if (prefix === "nep245" || prefix === "nep171") {
    const rest = asset_id.slice(separator + 1);
    const token_separator = rest.indexOf(":");
    if (token_separator === -1) {
      throw new Error(
        `intear dex: invalid asset id "${asset_id}" (missing token id after the contract id)`,
      );
    }
    const contract_id = rest.slice(0, token_separator);
    const token_id = rest.slice(token_separator + 1);
    if (contract_id.length === 0 || token_id.length === 0) {
      throw new Error(
        `intear dex: invalid asset id "${asset_id}" (empty contract id or token id)`,
      );
    }
    return { kind: prefix, contract_id, token_id };
  }
  throw new Error(
    `intear dex: invalid asset id "${asset_id}" (unknown prefix "${prefix}")`,
  );
}

// ========================================
// return the contract id used to look up token metadata for an
// INTEAR DEX asset id.
export function near_kit_intear_dex_asset_token_id_fun(
  asset_id: string,
): string {
  const parsed = near_kit_parse_intear_dex_asset_id_fun(asset_id);
  if (parsed.kind === "near") return "near";
  if (parsed.contract_id === null) {
    throw new Error(`INTEAR asset id has no token contract: ${asset_id}`);
  }
  return parsed.contract_id;
}

// ========================================
// write an INTEAR DEX asset id in borsh form.
export function near_kit_write_intear_dex_asset_id_fun(
  writer: BorshWriter,
  asset_id: string,
): void {
  const parsed = near_kit_parse_intear_dex_asset_id_fun(asset_id);
  switch (parsed.kind) {
    case "near":
      writer.u8(0);
      return;
    case "nep141":
      writer.u8(1);
      writer.string(parsed.contract_id as string);
      return;
    case "nep245":
      writer.u8(2);
      writer.string(parsed.contract_id as string);
      writer.string(parsed.token_id as string);
      return;
    case "nep171":
      writer.u8(3);
      writer.string(parsed.contract_id as string);
      writer.string(parsed.token_id as string);
      return;
  }
}

// ========================================
// read an INTEAR DEX asset id in borsh form.
export function near_kit_read_intear_dex_asset_id_fun(
  reader: BorshReader,
): string {
  const variant = reader.u8();
  switch (variant) {
    case 0:
      return "near";
    case 1:
      return `nep141:${reader.string()}`;
    case 2:
      return `nep245:${reader.string()}:${reader.string()}`;
    case 3:
      return `nep171:${reader.string()}:${reader.string()}`;
    default:
      throw new Error(`intear dex: unknown asset id variant ${variant}`);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
