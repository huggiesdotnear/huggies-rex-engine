// ========================================
// fetch token icons in small batches and cache them durably.
// ========================================
import { api_intear_tokens_get } from "../../../middleman";
import { HUGGIES_TOKEN_CACHE } from "./token_cache";
import type { HUGGIES_CACHED_TOKEN } from "./token_cache";
import { HUGGIES_TOKEN_ICON_FIELDS } from "./token_search";
// ========================================
// how many icons one batch asks for. the api caps an `ids` list at
// 2,000, but a batch of icons is a base64 data uri per token, so a
// small batch keeps the response small enough to be cheap.
const HUGGIES_ICON_BATCH_SIZE = 60;
// ========================================
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// fetch the icons for a set of token ids and cache them durably.
// --- WHY --- icons are NOT fetched with the token list. asking for the
// `icon` field on every indexed token costs ~21MB, because each icon
// is a full base64 data uri. instead the list is fetched without
// icons, and only the icons of the tokens actually on screen are
// fetched — in small batches — and written into the durable per-token
// store, where they are read back on every later visit and never
// fetched again.
export async function fetch_token_icons_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, string>> {
  const wanted = [...new Set(ids)];
  const out = new Map<string, string>();
  if (wanted.length === 0) return out;

  // the ids we already have an icon for cost nothing to serve.
  const cached = await HUGGIES_TOKEN_CACHE.get_many(wanted);
  const missing = wanted.filter((id) => {
    const hit = cached.get(id);
    return hit === undefined || hit.icon === null;
  });
  for (const [id, hit] of cached) {
    if (hit.icon !== null) out.set(id, hit.icon);
  }
  if (missing.length === 0) return out;

  for (let start = 0; start < missing.length; start += HUGGIES_ICON_BATCH_SIZE) {
    const batch = missing.slice(start, start + HUGGIES_ICON_BATCH_SIZE);
    const response = await api_intear_tokens_get({
      fields: HUGGIES_TOKEN_ICON_FIELDS,
      ids: batch,
    });
    const records: HUGGIES_CACHED_TOKEN[] = [];
    for (const row of response.rows) {
      const [id, symbol, decimals, icon] = row;
      const record: HUGGIES_CACHED_TOKEN = {
        id,
        symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : id,
        decimals: to_finite_number_fun(decimals),
        icon: typeof icon === "string" && icon.length > 0 ? icon : null,
      };
      records.push(record);
      if (record.icon !== null) out.set(record.id, record.icon);
    }
    await HUGGIES_TOKEN_CACHE.put_many(records);
  }
  return out;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
