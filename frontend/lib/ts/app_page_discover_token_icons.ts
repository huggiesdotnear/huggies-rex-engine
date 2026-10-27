// ========================================
// fetch token icons, cache-first.
//
// --- WHY --- an icon is a full base64 data uri. asking for the `icon`
// field on every indexed token costs ~21MB, so icons are never part
// of the list request. they are fetched for the rows on screen only,
// and written into the durable per-token store where they are read
// back on every later visit.
//
// --- WHY --- the cache is read FIRST, and only the misses are fetched.
// the earlier version fetched a sorted page of 300 tokens with the
// `icon` field on every visit — ~900KB every time, for icons that
// were already sitting in indexeddb. a token whose cached record has
// a null icon is a token the api answered for and that has no icon,
// so it is NOT a miss: it must not be refetched every load.
//
// the misses are fetched in two steps, because the api's url is
// limited to ~8KB and a token id list does not fit:
//   1. a sorted page with NO ids in the url — the api can serve one
//      on its own, and it covers the tokens that are on screen.
//   2. whatever that page did not cover, by id, over POST (whose body
//      limit is 64KB rather than a url limit).
// ========================================
import { api_intear_tokens_get } from "../../../middleman";
import { api_intear_tokens_post } from "../../../middleman";
import { HUGGIES_TOKEN_CACHE } from "./token_cache";
import type { HUGGIES_CACHED_TOKEN } from "./token_cache";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how many icons one request may ask for.
const HUGGIES_ICON_BATCH_SIZE = 300;
// the fields the icon request needs. the symbol and decimals come
// along so the cached record is complete.
const HUGGIES_ICON_FIELDS = ["symbol", "decimals", "icon"] as const;
// ========================================
// ========================================
// --- HELPERS ----------------------------
// parse a numeric API value without rendering NaN or Infinity.
function to_finite_number_fun(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
// ========================================
// turn api rows into cache records, and collect the icons.
function rows_to_records_fun(
  rows: ReadonlyArray<readonly (string | number | null)[]>,
): { records: HUGGIES_CACHED_TOKEN[]; icons: Map<string, string> } {
  const records: HUGGIES_CACHED_TOKEN[] = [];
  const icons = new Map<string, string>();
  for (const row of rows) {
    const id = String(row[0]);
    const symbol = row[1];
    const decimals = row[2];
    const icon = row[3];
    const record: HUGGIES_CACHED_TOKEN = {
      id,
      symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : id,
      decimals: to_finite_number_fun(decimals),
      icon: typeof icon === "string" && icon.length > 0 ? icon : null,
    };
    records.push(record);
    if (record.icon !== null) icons.set(record.id, record.icon);
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
  // cached icon is null was answered for by the api and has no icon,
  // so it is known, not missing — refetching it would cost a request
  // on every single load forever.
  const missing = wanted.filter((id) => !cached.has(id));
  for (const [id, hit] of cached) {
    if (hit.icon !== null) out.set(id, hit.icon);
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
    const { records, icons } = rows_to_records_fun(response.rows);
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
    const { records, icons } = rows_to_records_fun(response.rows);
    for (const id of records) covered.add(id.id);
    for (const [id, icon] of icons) out.set(id, icon);
    await HUGGIES_TOKEN_CACHE.put_many(records);
  }
  return out;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
