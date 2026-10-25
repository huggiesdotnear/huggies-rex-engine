// ========================================
// typed local parser for INTEAR DEX asset identifiers.
// ========================================
export interface HUGGIES_INTEAR_ASSET_ID {
  kind: "near" | "nep141" | "nep245" | "nep171";
  contract_id: string | null;
  token_id: string | null;
}
// ========================================
// parse an INTEAR asset id and return its token metadata lookup id.
export function intear_asset_id_fun(asset_id: string): HUGGIES_INTEAR_ASSET_ID {
  if (asset_id === "near") {
    return { kind: "near", contract_id: null, token_id: null };
  }
  const separator = asset_id.indexOf(":");
  if (separator === -1) throw new Error(`invalid INTEAR asset id: ${asset_id}`);
  const prefix = asset_id.slice(0, separator);
  const rest = asset_id.slice(separator + 1);
  if (prefix === "nep141" && rest.length > 0) {
    return { kind: "nep141", contract_id: rest, token_id: null };
  }
  if (prefix === "nep245" || prefix === "nep171") {
    const token_separator = rest.indexOf(":");
    if (token_separator <= 0 || token_separator === rest.length - 1) {
      throw new Error(`invalid INTEAR asset id: ${asset_id}`);
    }
    return {
      kind: prefix,
      contract_id: rest.slice(0, token_separator),
      token_id: rest.slice(token_separator + 1),
    };
  }
  throw new Error(`invalid INTEAR asset id: ${asset_id}`);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
