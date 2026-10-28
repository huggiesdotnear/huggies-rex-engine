// ========================================
// read-through token info: the one place the app asks "what do I know
// about this token?". checks the durable cache for immutable metadata
// (symbol, decimals, icon) and always refetches the volatile half
// (price_usd, reputation) from intear. callers get a single flat
// record per token and never touch the cache or the api directly.
import { api_intear_tokens_get } from "../../../middleman";
import { HUGGIES_TOKEN_CACHE } from "./token_cache";
import type { HUGGIES_CACHED_TOKEN } from "./token_cache";
import { icon_hash_of_fun, token_icon_for_fun } from "./token_icon_url";
import {
  HUGGIES_NEAR_DECIMALS,
  HUGGIES_NEAR_ID,
  HUGGIES_NEAR_SYMBOL,
  HUGGIES_WRAP_ID,
} from "./token_near";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the fields this system fetches. keep the volatile and durable lists
// in sync with which fields land in the cache below.
// volatile: changes constantly, never cached. fetched for every id on
// every load, so it stays a small field set.
const HUGGIES_VOLATILE_FIELDS = ["price_usd", "reputation", "holders"] as const;
// durable: fixed for a token's life, cached in indexeddb forever.
//
// `icon_hash` and not `icon`: the icon field is a full inline svg data
// uri and makes up almost the entire payload — 336KB for ~100 tokens
// with the icons, ~10KB without. the hash is 16 characters, and the
// icon itself is served from a content-addressed url the browser
// caches for a year. see lib/ts/token_icon_url.ts.
const HUGGIES_DURABLE_FIELDS = ["symbol", "decimals", "icon_hash"] as const;
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
// --- NEAR ------------------------------
// describe the chain's own token, which the token registry does not
// carry. its usd price is borrowed from wNEAR, which tracks NEAR 1:1.
// --- WHY --- wNEAR is a 1:1 redeemable wrapper of NEAR, so its
// price_usd is the same number to the precision this table shows.
// fetching it costs nothing extra: the native balance only ever appears
// on an account that may well already hold wNEAR, and when it does not
// the price simply reads as unknown rather than being invented.
function near_info_fun(wnear: {
  price_usd: number;
  icon: string | null;
}): HUGGIES_TOKEN_INFO {
  return {
    id: HUGGIES_NEAR_ID,
    symbol: HUGGIES_NEAR_SYMBOL,
    decimals: HUGGIES_NEAR_DECIMALS,
    // the chain token has no registry entry of its own, so it borrows
    // wNEAR's icon — which IS the NEAR logo (the green #00EC97 "N"),
    // not a lookalike.
    icon: wnear.icon,
    price_usd: wnear.price_usd,
    reputation: "Reputable",
    holders: 0,
  };
}
// ========================================
// ========================================
// --- FETCH -----------------------------
// fetch the volatile half for every id on every load, and the durable
// half only for ids not already cached, then merge into flat records.
// --- WHY --- two requests with different field sets, not one with all
// of them. `icon` is a full inline svg data uri, so asking for it on
// ids already cached costs ~326KB of the ~336KB response and buys
// nothing — those bytes are already in indexeddb. splitting it means a
// revisit fetches ~10KB of price/reputation instead.
async function fetch_and_merge_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, HUGGIES_TOKEN_INFO>> {
  const out = new Map<string, HUGGIES_TOKEN_INFO>();
  if (ids.length === 0) return out;

  // ask for wNEAR alongside the requested ids so the native NEAR row
  // can be priced without a second round trip.
  const wants_near = ids.includes(HUGGIES_NEAR_ID);
  const asked = wants_near ? [...new Set([...ids, HUGGIES_WRAP_ID])] : ids;

  const cached = await HUGGIES_TOKEN_CACHE.get_many(asked);
  // the ids whose symbol/decimals/icon we have never stored. on a warm
  // cache this is empty, so no durable request is made at all.
  //
  // `near` is EXCLUDED on purpose. intear has no `near` entry in
  // /tokens — it comes back in the response's `missing` list — so it
  // can never be written to the cache by the api. which used to mean it
  // was "uncached" on every single load, and every caller that wanted
  // it fired its own durable request for it. `near` is described
  // locally and cached explicitly below instead.
  const uncached = asked.filter(
    (id) => id !== HUGGIES_NEAR_ID && !cached.has(id),
  );

  // 1. durable fields, only for ids we have never stored. empty list
  // means a warm cache, and the request is skipped entirely.
  // --- WHY --- `fetched` is kept and used as the source of truth for
  // these rows, rather than reading them back out of the cache right
  // after writing them. the cache write can legitimately fail (no
  // indexeddb in this runtime, storage blocked in private mode), and
  // reading it back would then hand back nothing — leaving every token
  // with decimals 0 and the contract id as its symbol, which renders
  // balances like 1.23e+35. using the values we just received makes the
  // render correct whether or not the cache took the write.
  const fetched = new Map<string, HUGGIES_CACHED_TOKEN>();
  if (uncached.length > 0) {
    const fresh = await api_intear_tokens_get({
      fields: HUGGIES_DURABLE_FIELDS,
      ids: uncached,
    });
    // --- WHY --- the row is read by column NAME, not by index: the api
    // always returns `account_id` as the first column, even when it was
    // not requested, so a fixed index read is shifted by one.
    const columns = fresh.columns;
    const id_at = columns.indexOf("account_id");
    const symbol_at = columns.indexOf("symbol");
    const decimals_at = columns.indexOf("decimals");
    const hash_at = columns.indexOf("icon_hash");
    const to_cache = fresh.rows.map((row) => {
      const id = String(id_at >= 0 ? row[id_at] : row[0]);
      const symbol = symbol_at >= 0 ? row[symbol_at] : row[1];
      const decimals = decimals_at >= 0 ? row[decimals_at] : row[2];
      const hash = hash_at >= 0 ? row[hash_at] : row[3];
      const record: HUGGIES_CACHED_TOKEN = {
        id,
        symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : id,
        decimals: to_number_fun(decimals),
        icon_hash: icon_hash_of_fun(hash),
      };
      fetched.set(id, record);
      return record;
    });
    await HUGGIES_TOKEN_CACHE.put_many(to_cache);
  }

  // 2. volatile fields for every id, so usd values are never stale.
  const live = await api_intear_tokens_get({
    fields: HUGGIES_VOLATILE_FIELDS,
    ids: asked,
  });
  // durable values: what we just fetched wins over the stored copy, so
  // a failed cache write cannot strip decimals off a token.
  const durable = new Map(cached);
  for (const [id, record] of fetched) durable.set(id, record);
  // `near` is described locally, so it never needs a durable request.
  // it goes into the durable map so the render below has its symbol and
  // decimals.
  if (asked.includes(HUGGIES_NEAR_ID)) {
    durable.set(HUGGIES_NEAR_ID, {
      id: HUGGIES_NEAR_ID,
      symbol: HUGGIES_NEAR_SYMBOL,
      decimals: HUGGIES_NEAR_DECIMALS,
      icon_hash: null,
    });
  }

  for (const row of live.rows) {
    const [id, price_usd, reputation, holders] = row;
    const base = durable.get(id);
    const record: HUGGIES_TOKEN_INFO = {
      id,
      symbol: base?.symbol ?? id,
      decimals: base?.decimals ?? 0,
      icon: token_icon_for_fun(id, base?.icon_hash ?? null),
      price_usd: to_number_fun(price_usd),
      reputation: typeof reputation === "string" ? reputation : "Unknown",
      holders: to_number_fun(holders),
    };
    out.set(id, record);
  }

  // the registry has no `near`, so supply it ourselves from wNEAR.
  const wnear = out.get(HUGGIES_WRAP_ID);
  if (wants_near && !out.has(HUGGIES_NEAR_ID)) {
    const wrap_durable = durable.get(HUGGIES_WRAP_ID);
    out.set(
      HUGGIES_NEAR_ID,
      near_info_fun({
        price_usd: wnear?.price_usd ?? 0,
        icon: token_icon_for_fun(
          HUGGIES_WRAP_ID,
          wrap_durable?.icon_hash ?? null,
        ),
      }),
    );
  }

  // anything we hold durably but the live call did not return: still show
  // it, with no fresh price to go on.
  for (const [id, base] of durable) {
    if (out.has(id)) continue;
    out.set(id, {
      id,
      symbol: base.symbol,
      decimals: base.decimals,
      icon: token_icon_for_fun(id, base.icon_hash),
      price_usd: 0,
      reputation: "Unknown",
      holders: 0,
    });
  }

  // `near` is written to the cache so later loads treat it as known.
  //
  // --- WHY --- the api has no `near` row, so the loop above never
  // stores it. without this it stayed uncached forever, and every
  // caller that wanted it made its own durable request for it. writing
  // it here closes that hole for good. `wrap.near` is a real token and
  // is stored by the api response, but it is written here too so the
  // pair is kept together.
  const to_store: Array<HUGGIES_CACHED_TOKEN> = [];
  for (const id of [HUGGIES_NEAR_ID, HUGGIES_WRAP_ID]) {
    const record = durable.get(id);
    if (record !== undefined) to_store.push(record);
  }
  await HUGGIES_TOKEN_CACHE.put_many(to_store);

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
