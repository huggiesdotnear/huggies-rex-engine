// ========================================
// read-through token info: the one place the app asks "what do I know
// about this token?". checks the durable cache for immutable metadata
// (symbol, decimals, icon) and always refetches the volatile half
// (price_usd, reputation) from intear. callers get a single flat
// record per token and never touch the cache or the api directly.
import { api_intear_tokens_get } from "../../../middleman";
import { HUGGIES_TOKEN_CACHE } from "./token_cache";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the fields this system fetches. keep the volatile and durable lists
// in sync with which fields land in the cache below.
// volatile: changes constantly, never cached.
const HUGGIES_VOLATILE_FIELDS = ["price_usd", "reputation", "holders"] as const;
// durable: fixed for a token's life, cached in indexeddb forever.
const HUGGIES_DURABLE_FIELDS = ["symbol", "decimals", "icon"] as const;
// all fields, in the order the response returns them.
const HUGGIES_TOKEN_FIELDS = [
  ...HUGGIES_DURABLE_FIELDS,
  ...HUGGIES_VOLATILE_FIELDS,
] as const;
// ========================================
// ========================================
// --- TYPES ------------------------------
// everything the ui needs to render a token. `decimals` and `icon` may
// come from cache; the rest are always fresh.
export interface HUGGIES_TOKEN_INFO {
  id: string;
  symbol: string;
  decimals: number;
  icon: string | null;
  price_usd: number;
  reputation: string;
  holders: number;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// safe number parse: the api returns decimal strings, and a token with
// no price reports 0 or a malformed value rather than erroring.
function to_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// ========================================
// --- FETCH -----------------------------
// fetch metadata for the ids we do not already have cached, cache the
// durable fields, and merge everything into flat records.
// --- WHY --- a fresh price/reputation is fetched for every id on every
// call even when its metadata is cached, because those values go stale
// within minutes; only the never-changing fields come from the cache.
async function fetch_and_merge_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, HUGGIES_TOKEN_INFO>> {
  const out = new Map<string, HUGGIES_TOKEN_INFO>();
  if (ids.length === 0) return out;

  // durable metadata we already hold, used to fill any id the fresh
  // response omits (a token can drop out of /tokens between calls).
  const cached = await HUGGIES_TOKEN_CACHE.get_many(ids);

  const response = await api_intear_tokens_get({
    fields: HUGGIES_TOKEN_FIELDS,
    ids,
  });

  const durable_to_cache = [];
  for (const row of response.rows) {
    const [id, symbol, decimals, icon, price_usd, reputation, holders] = row;
    const record: HUGGIES_TOKEN_INFO = {
      id,
      symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : id,
      decimals: to_number_fun(decimals),
      icon: typeof icon === "string" && icon.length > 0 ? icon : null,
      price_usd: to_number_fun(price_usd),
      reputation: typeof reputation === "string" ? reputation : "Unknown",
      holders: to_number_fun(holders),
    };
    out.set(id, record);
    durable_to_cache.push({
      id,
      symbol: record.symbol,
      decimals: record.decimals,
      icon: record.icon,
    });
  }

  // write the durable half back so the next read is served from cache.
  await HUGGIES_TOKEN_CACHE.put_many(durable_to_cache);

  // anything we hold durably but the api did not return: still show it,
  // with no fresh price/reputation to go on.
  for (const [id, durable] of cached) {
    if (out.has(id)) continue;
    out.set(id, {
      ...durable,
      price_usd: 0,
      reputation: "Unknown",
      holders: 0,
    });
  }
  return out;
}
// ========================================
// ========================================
// --- GET -------------------------------
// the public read-through call. returns a map of id -> info for every
// id the api knows about; ids it does not know are absent from the map.
// --- WHY --- one request covers every id, cached or not: price and
// reputation go stale within minutes, so they are refetched for ALL ids
// on every call anyway. fetching only the uncached ones and merging
// would save nothing and cost a second round trip.
async function get_token_info_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, HUGGIES_TOKEN_INFO>> {
  const unique_ids = [...new Set(ids)];
  if (unique_ids.length === 0) return new Map();
  return fetch_and_merge_fun(unique_ids);
}
// ========================================
// ========================================
// public surface, one import for callers.
export const HUGGIES_TOKEN_INFO = {
  get: get_token_info_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================