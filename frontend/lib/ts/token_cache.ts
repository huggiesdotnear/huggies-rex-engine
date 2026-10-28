// ========================================
// the durable, never-expiring half of token metadata: symbol,
// decimals, icon hash. a tokens object store holds one entry per token
// id so any page or component can read metadata without refetching.
// volatile data (price_usd, reputation) is deliberately NOT cached —
// it moves constantly and is refetched on each load. see
// lib/ts/token_info.ts for the read-through path that combines the two.
//
// --- WHY --- the icon is stored as its HASH, not as the image. the
// api's `icon` field is a full inline data uri — a couple of kilobytes
// per token — and storing that for every token in the app is megabytes
// of indexeddb. the `icon_hash` field is 16 characters, and the icon
// itself is served from a content-addressed url that the browser
// caches for a year. see lib/ts/token_icon_url.ts.
//
// the indexeddb mechanics live in lib/ts/indexed_db_store.ts — this
// file only says WHICH store this cache is and what a row looks like.
import { HUGGIES_INDEXED_DB_STORE } from "./indexed_db_store";
// ========================================
const HUGGIES_TOKEN_DB_NAME = "huggies_tokens";
const HUGGIES_TOKEN_DB_VERSION = 1;
const HUGGIES_TOKEN_STORE = "tokens";
// ========================================
// the cache's identity, handed to the shared store module.
const HUGGIES_TOKEN_STORE_CONFIG = {
  db_name: HUGGIES_TOKEN_DB_NAME,
  db_version: HUGGIES_TOKEN_DB_VERSION,
  store_name: HUGGIES_TOKEN_STORE,
};
// ========================================
// ========================================
// --- SHAPE ------------------------------
// one row in the tokens store. keyed by `id`. these are the fields
// that do not change for the life of a token.
//
// `icon_hash` is the api's icon hash, not an image. it is turned into
// a url by lib/ts/token_icon_url.ts.
export interface HUGGIES_CACHED_TOKEN {
  id: string;
  symbol: string;
  decimals: number;
  icon_hash: string | null;
  // the pre-hash cache stored the inline icon under this field. it is
  // read for old browser records and is absent from new ones.
  icon?: string | null;
}
// ========================================
// ========================================
// --- READ ------------------------------
// look up one cached token; resolves null when absent or on any db
// failure, so a cache problem degrades to a refetch instead of an
// error the ui has to handle.
async function get_cached_token_fun(
  id: string,
): Promise<HUGGIES_CACHED_TOKEN | null> {
  const found = await HUGGIES_INDEXED_DB_STORE.get_many<HUGGIES_CACHED_TOKEN>(
    HUGGIES_TOKEN_STORE_CONFIG,
    [id],
  );
  return found.get(id) ?? null;
}
// ========================================
// look up many ids at once. missing ids are simply absent from the
// returned map, which is the caller's signal to fetch them.
async function get_cached_tokens_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, HUGGIES_CACHED_TOKEN>> {
  return HUGGIES_INDEXED_DB_STORE.get_many<HUGGIES_CACHED_TOKEN>(
    HUGGIES_TOKEN_STORE_CONFIG,
    ids,
  );
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// upsert many tokens in one transaction. never throws: a failed cache
// write only costs a refetch next time.
async function put_cached_tokens_fun(
  tokens: ReadonlyArray<HUGGIES_CACHED_TOKEN>,
): Promise<void> {
  await HUGGIES_INDEXED_DB_STORE.put_many(HUGGIES_TOKEN_STORE_CONFIG, tokens);
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the cache surface. exported as one object so callers have a single
// import; every function is safe to call in a non-browser (returns
// empty / no-ops) so components never need to guard.
export const HUGGIES_TOKEN_CACHE = {
  get: get_cached_token_fun,
  get_many: get_cached_tokens_fun,
  put_many: put_cached_tokens_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
