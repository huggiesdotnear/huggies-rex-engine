// ========================================
// fetch token icon hashes, cache-first.
//
// --- WHY --- the icon HASH is what is fetched, not the icon. the
// api's `icon` field is the icon as a full inline data uri — a couple
// of kilobytes per token — so asking for it on a page of 300 tokens
// costs ~880KB uncompressed, ~630KB gzipped, and takes over a second.
// the `icon_hash` field is 16 characters and the same page costs ~18KB
// uncompressed, ~8KB gzipped.
//
// the icon itself is then fetched by the browser from
// `/icon/<icon_hash>.webp`, a content-addressed url the browser caches
// for a year. so the icons still show, they just travel as urls rather
// than as megabytes of inline svg. see lib/ts/token_icon_url.ts.
//
// --- WHY --- the cache is read FIRST, and only the misses are fetched.
// the earlier version fetched a sorted page of 300 tokens with the
// `icon` field on every visit — ~900KB every time, for icons that
// were already sitting in indexeddb. a token whose cached record has
// a null icon hash is a token the api answered for and that has no
// icon, so it is NOT a miss: it must not be refetched every load.
//
// the misses are fetched in two steps, because the api's url is
// limited to ~8KB and a token id list does not fit:
//   1. a sorted page with NO ids in the url — the api can serve one
//      on its own, and it covers the tokens that are on screen.
//   2. whatever that page did not cover, by id, over POST (whose body
//      limit is 64KB rather than a url limit).
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
// the fields the icon request needs. the symbol and decimals come
// along so the cached record is complete.
//
// `icon_hash` and not `icon`: the hash is 16 characters, the icon is
// a couple of kilobytes. the url is built from the hash.
const HUGGIES_ICON_FIELDS = ["symbol", "decimals", "icon_hash"] as const;
// ========================================
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// turn api rows into cache records, and collect the icon urls.
//
// --- WHY --- the row is read by column NAME, not by index: the api
// always returns `account_id` as the first column, even when it was
// not requested, so a fixed index read is shifted by one — the id
// would land in the symbol slot and the icon hash in the decimals
// slot. the columns come back in the order they were asked for, so
// `icon_hash` is the fourth only by that luck.
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
// get the icons for a set of token ids, using the durable cache for
// every token it already knows.
//
// `sort` is the sort the visible list is using. it lets the api serve
// the icons as a sorted page with no ids in the url at all, which is
// far cheaper than carrying a list of ids.
//
// --- WHY --- the sorted page is only used when it can actually answer
// for the tokens we want. it holds 300 tokens taken from the TOP of
// the sort, so it is the right set only for a descending list. an
// ascending list starts at the bottom of the sort, and a search is a
// handful of arbitrary tokens — for both, the page covers none of
// them, so asking for it fetched ~800KB of icons for nothing.
//
// so the page is fetched only for a descending list that is a page's
// worth of tokens. otherwise the ids are asked for directly, which is
// one small request for one small set.
export async function fetch_token_icons_fun(
  ids: ReadonlyArray<string>,
  sort?: { by: string; desc: boolean },
): Promise<Map<string, string>> {
  const wanted = [...new Set(ids)];
  const out = new Map<string, string>();
  if (wanted.length === 0) return out;

  // the ids we already know about cost nothing to serve.
  const cached = await HUGGIES_TOKEN_CACHE.get_many(wanted);
  // a token that is NOT in the cache at all is missing. a token whose
  // cached icon hash is null was answered for by the api and has no
  // icon, so it is known, not missing — refetching it would cost a
  // request on every single load forever.
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
  // for it again by id would be a wasted request every single time.
  const covered = new Set<string>();

  // 1. the sorted page — no ids in the url at all.
  //
  // --- WHY --- the page is the set we want ONLY when the sort is
  // descending AND the set is exactly one page. descending means the
  // page starts at the top of the sort, which is the first page the
  // reader was shown. ascending means the page starts at the BOTTOM
  // of the sort — a completely different set of tokens — so asking for
  // it answered for none of them and cost a request and ~800KB for
  // nothing.
  //
  // --- WHY --- the count has to match too. the list page carries the
  // marked tokens on top, so it asks for 306 icons while the page
  // holds 300; the extra 6 are asked for by id below.
  const page_matches =
    sort !== undefined &&
    sort.desc === true &&
    wanted.length >= HUGGIES_ICON_BATCH_SIZE;
  if (page_matches && sort !== undefined) {
    const response = await api_intear_tokens_get({
      fields: HUGGIES_ICON_FIELDS,
      sort: { by: sort.by as "volume_usd_24h", desc: sort.desc },
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

  // 2. whatever the page did not cover — by id, over POST.
  const still_missing = missing.filter((id) => !covered.has(id));
  if (still_missing.length > 0) {
    const response = await api_intear_tokens_post({
      fields: HUGGIES_ICON_FIELDS,
      ids: still_missing,
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
