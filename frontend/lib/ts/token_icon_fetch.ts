// ========================================
// fetch token icons in batches and cache them durably.
// ========================================
import { api_intear_tokens_get } from "../../../middleman";
import { HUGGIES_TOKEN_CACHE } from "./token_cache";
import type { HUGGIES_CACHED_TOKEN } from "./token_cache";
import { HUGGIES_TOKEN_ICON_FIELDS } from "./token_search";
// ========================================
// the api refuses a request whose url is too long, with a 414.
// --- WHY --- the limit is measured on the BYTES of the url, not on the
// number of ids. measured on mainnet: 170 ids of ~44 chars each (a
// 7.9KB url) is accepted, 180 ids (8.4KB) is refused with 414, and
// 600 short ids (7.1KB) is accepted. so the safe batch is not a fixed
// count — it is however many ids fit in the byte budget below.
//
// the token ids vary a lot in length (from `wrap.near` to a 64-char
// hex address plus a `.factory.bridge.near` suffix), so a fixed count
// would either waste requests on short ids or blow the limit on long
// ones. the budget is computed per batch instead.
const HUGGIES_ICON_URL_BYTE_BUDGET = 7000;
// the most ids one batch may ask for, whatever the url length.
const HUGGIES_ICON_MAX_BATCH = 600;
// ========================================
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// split ids into batches that each fit the url byte budget.
export function token_icon_batches_fun(
  ids: ReadonlyArray<string>,
): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  // the part of the url that is not the ids list: the host, the path,
  // the fields, and the ids key itself.
  const fixed =
    "https://api.intea.rs/tokens?fields=" +
    encodeURIComponent(HUGGIES_TOKEN_ICON_FIELDS.join(",")) +
    "&ids=";
  let current_length = fixed.length;
  for (const id of ids) {
    // the comma before this id, and the id itself, url-encoded.
    const cost = encodeURIComponent(id).length + (current.length > 0 ? 1 : 0);
    if (
      current.length > 0 &&
      (current_length + cost > HUGGIES_ICON_URL_BYTE_BUDGET ||
        current.length >= HUGGIES_ICON_MAX_BATCH)
    ) {
      batches.push(current);
      current = [];
      current_length = fixed.length;
    }
    current.push(id);
    current_length += cost;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}
// ========================================
// fetch the icons for a set of token ids and cache them durably.
// --- WHY --- icons are NOT fetched with the token list. asking for the
// `icon` field on every indexed token costs ~21MB, because each icon
// is a full base64 data uri. instead the list is fetched without
// icons, and only the icons of the tokens actually on screen are
// fetched — in batches that fit the api's url limit — and written into
// the durable per-token store, where they are read back on every later
// visit and never fetched again.
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

  for (const batch of token_icon_batches_fun(missing)) {
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
