// ========================================
// typed local view helper for INTEAR DEX registered account assets.
// ========================================
import { near_kit_client } from "@near-kit-tool-box/web";
// ========================================
export type HUGGIES_INTEAR_REGISTERED_ASSET = readonly [string, string];
// ========================================
const HUGGIES_INTEAR_REGISTERED_ASSETS_PAGE_SIZE = 100;
// ========================================
// fetch every registered internal asset and balance for one account.
export async function intear_registered_assets_fun(
  account_id: string,
): Promise<ReadonlyArray<HUGGIES_INTEAR_REGISTERED_ASSET>> {
  const near = near_kit_client();
  const out: Array<HUGGIES_INTEAR_REGISTERED_ASSET> = [];
  for (;;) {
    const value = await near.view<unknown>(
      "dex.intear.near",
      "registered_assets_of",
      {
        account_id,
        from_index: out.length,
        limit: HUGGIES_INTEAR_REGISTERED_ASSETS_PAGE_SIZE,
      },
    );
    if (!Array.isArray(value)) {
      throw new Error("INTEAR registered_assets_of returned an invalid array");
    }
    for (const row of value) {
      if (
        !Array.isArray(row) ||
        row.length !== 2 ||
        typeof row[0] !== "string" ||
        typeof row[1] !== "string"
      ) {
        throw new Error("INTEAR registered_assets_of returned an invalid row");
      }
      out.push([row[0], row[1]]);
    }
    if (value.length < HUGGIES_INTEAR_REGISTERED_ASSETS_PAGE_SIZE) return out;
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
