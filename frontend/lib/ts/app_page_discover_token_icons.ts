// ========================================
// fetch token icon hashes, cache-first.
//
// --- WHY --- the icon HASH is what is fetched, not the icon. the api's
// `icon` field is a full inline data uri — a couple of kilobytes per
// token — so asking for it on a page of 300 tokens costs ~880KB
// uncompressed, ~630KB gzipped. the `icon_hash` field is 16 characters and
// the same page costs ~18KB uncompressed, ~8KB gzipped.
//
// the icon itself is then fetched by the browser from
// `/icon/<icon_hash>.webp`, a content-addressed url the browser caches for
// a year. see lib/ts/token_icon_url.ts.
//
// --- WHY --- the cache is read FIRST, and only the misses are fetched.
// the earlier version fetched a sorted page of 300 tokens with the
// `icon` field on every visit — ~900KB every time, for icons that
// were already sitting in indexeddb. a cached record with a null icon
// hash is a token the api answered for and that has no icon, so it is
// NOT a miss: it must not be refetched every load.
//
// the misses are fetched in two steps, because the api's url is limited to
// ~8KB and a token id list does not fit:
//   1. a sorted page with NO ids in the url — the api can serve one on its
//      own, and it covers the tokens that are on screen.
//   2. whatever that page did not cover, by id, over POST (whose body
//      limit is 64KB rather than a url limit).
//
// --- WHY --- step 1 is used ONLY when the ids asked for ARE the top of
// that sort. the caller promises it, and this file checks it. a search
// result is a handful of arbitrary tokens and a later page of the list
// starts where the top ended — neither is the top of the sort, so the
// sorted page would cover NONE of them and would cost a page of icons
// for nothing. those sets are asked for by id, over POST.
// ========================================
import { api_intear_tokens_get } from "@sleet-js/middleman-intear-api";
import { api_intear_tokens_post } from "@sleet-js/middleman-intear-api";
import { HUGGIES_TOKEN_CACHE } from "./token_cache";
import type { HUGGIES_CACHED_TOKEN } from "./token_cache";
import { icon_hash_of_fun, token_icon_for_fun } from "./token_icon_url";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how many icons one request may ask for.
const HUGGIES_ICON_BATCH_SIZE = 300;
// the POST body's limit is 64KB, and the ids are chunked so one request
// stays well under it.
//
// --- WHY --- a near account id is 64 hex characters and a token id adds
// a label on top, so a page of ids can be a long way from the limit.
// the budget is half of it, so a normal page of 300 ids is still ONE
// request and only a very long id list is split.
const HUGGIES_ICON_POST_BODY_LIMIT = 32 * 1024;
// the fields the icon request needs. the symbol and decimals come
// along so the cached record is complete.
//
// `icon_hash` and not `icon`: the hash is 16 characters, the icon is
// a couple of kilobytes.
const HUGGIES_ICON_FIELDS = ["symbol", "decimals", "icon_hash"] as const;
// ========================================
// ========================================
// --- SOURCE -----------------------------
// the ids asked for ARE the top of a sorted list.
//
// --- WHY --- this is a promise about the ids, not about the page the
// reader is looking at. it is what lets the api serve them as one
// sorted page with no ids in the url at all. a caller that cannot
// promise it — a search result, a later page of the list — leaves it
// out and the ids are asked for by id.
export interface HUGGIES_TOKEN_ICON_SOURCE {
  // the sort field the ids are the top of.
  by: string;
  // true when the ids are the top of that sort. an ascending list
  // starts at the BOTTOM of the sort, so the api's page would cover
  // none of its rows.
  desc: boolean;
}
// ========================================
// ========================================
// --- CHUNK ------------------------------
// split the ids into groups whose json body stays under the limit.
//
// --- WHY --- the size of an id in the body is its length plus two
// quotes and a comma. the budget is generous, so a normal page of ids
// is one request and only a very long id list is split.
function chunk_ids_fun(ids: ReadonlyArray<string>): string[][] {
  const chunks: string[][] = [];
  let chunk: string[] = [];
  let size = 0;
  for (const id of ids) {
    const cost = id.length + 3;
    if (chunk.length > 0 && size + cost > HUGGIES_ICON_POST_BODY_LIMIT) {
      chunks.push(chunk);
      chunk = [];
      size = 0;
    }
    chunk.push(id);
    size += cost;
  }
  if (chunk.length > 0) chunks.push(chunk);
  return chunks;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// --- WHY --- the row is read by column NAME, not by index: the api
// always returns `account_id` as the first column, even when it was
// not requested, so a fixed index read is shifted by one — the id
// would land in the symbol slot.
function rows_to_records_fun(
  columns: ReadonlyArray<string>,
  rows: ReadonlyArray<readonly (string | number | null)[]>,
): { records: HUGGIES_CACHED_TOKEN[]; icons: Map<string, string> } {
  const records: HUGGIES_CACHED_TOKEN[] = [];
  const icons = new Map<string, string>();
  const id_at = columns.indexOf("account_id");
  const symbol_at = columns.indexOf("symbol");
  const decimals_at = columns.indexOf("decimals");
  const hash_at = columns.indexOf("icon_hash");
  for (const row of rows) {
    const id = String(id_at >= 0 ? row[id_at] : row[0]);
    const symbol = symbol_at >= 0 ? row[symbol_at] : row[1];
    const decimals = decimals_at >= 0 ? row[decimals_at] : row[2];
    const hash = hash_at >= 0 ? row[hash_at] : row[3];
    const record: HUGGIES_CACHED_TOKEN = {
      id,
      symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : id,
      decimals: to_finite_number_fun(decimals),
      icon_hash: icon_hash_of_fun(hash),
    };
    records.push(record);
    const url = token_icon_for_fun(record.id, record.icon_hash);
    if (url !== null) icons.set(record.id, url);
  }
  return { records, icons };
}
// ========================================
// ========================================
// --- FETCH -----------------------------
// `source` is the promise that the ids ARE the top of that sort. it
// lets the api serve the icons as a sorted page with no ids in the url
// at all, far cheaper than carrying a list of ids.
//
// --- WHY --- the sorted page is only used when it can actually answer
// for the tokens we want. it holds 300 tokens taken from the TOP of the
// sort, so it is the right set only for a descending list whose rows
// start at the top. an ascending list starts at the bottom of the sort,
// and a search is a handful of arbitrary tokens — for both, the page
// covers none of them, so asking for it fetched ~800KB of icons for
// nothing.
//
// so the page is fetched only when the caller says the ids are the top
// of a descending sort AND there are enough of them to be worth a page
// of its own. otherwise the ids are asked for directly.
export async function fetch_token_icons_fun(
  ids: ReadonlyArray<string>,
  source?: HUGGIES_TOKEN_ICON_SOURCE,
): Promise<Map<string, string>> {
  const wanted = [...new Set(ids)];
  const out = new Map<string, string>();
  if (wanted.length === 0) return out;

  // the ids we already know about cost nothing to serve.
  const cached = await HUGGIES_TOKEN_CACHE.get_many(wanted);
  // a token that is NOT in the cache at all is missing. a token whose
  // cached icon hash is null was answered for by the api and has no
  // icon, so it is known, not missing — refetching it would cost a
  // request on every load forever.
  const missing = wanted.filter((id) => !cached.has(id));
  for (const [id, hit] of cached) {
    // old cache records stored the inline icon under `icon`; the hash
    // migration left those records without `icon_hash`. read the old
    // field too so an existing browser cache keeps working.
    const url = token_icon_for_fun(id, hit.icon_hash);
    if (url !== null) {
      out.set(id, url);
    } else if (typeof hit.icon === "string" && hit.icon.length > 0) {
      out.set(id, hit.icon);
    }
  }
  if (missing.length === 0) return out;

  // `covered` tracks every id the api answered for, NOT only the ones
  // with an icon: a token with no icon is still answered, and asking
  // for it again by id would waste a request every time.
  const covered = new Set<string>();

  // 1. the sorted page — no ids in the url at all.
  //
  // --- WHY --- the count has to match too. the list page carries the
  // marked tokens with it, so it asks for more icons than the api page
  // holds; the extra ones are asked for by id below.
  const page_matches =
    source !== undefined &&
    source.desc === true &&
    wanted.length >= HUGGIES_ICON_BATCH_SIZE;
  if (page_matches && source !== undefined) {
    const response = await api_intear_tokens_get({
      fields: HUGGIES_ICON_FIELDS,
      sort: { by: source.by as "volume_usd_24h", desc: source.desc },
      limit: HUGGIES_ICON_BATCH_SIZE,
    });
    const { records, icons } = rows_to_records_fun(
      response.columns,
      response.rows,
    );
    for (const id of records) covered.add(id.id);
    for (const [id, icon] of icons) out.set(id, icon);
    await HUGGIES_TOKEN_CACHE.put_many(records);
  }

  // 2. whatever the page did not cover — by id, over POST, in chunks
  // that fit the body's 64KB limit.
  const still_missing = missing.filter((id) => !covered.has(id));
  for (const chunk of chunk_ids_fun(still_missing)) {
    const response = await api_intear_tokens_post({
      fields: HUGGIES_ICON_FIELDS,
      ids: chunk,
    });
    const { records, icons } = rows_to_records_fun(
      response.columns,
      response.rows,
    );
    for (const id of records) covered.add(id.id);
    for (const [id, icon] of icons) out.set(id, icon);
    await HUGGIES_TOKEN_CACHE.put_many(records);
  }
  return out;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
