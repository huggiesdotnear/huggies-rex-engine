// ========================================
// fetch token icons and cache them durably.
// ========================================
import { api_intear_tokens_get } from "../../../middleman";
import { api_intear_tokens_post } from "../../../middleman";
import { HUGGIES_TOKEN_CACHE } from "./token_cache";
import type { HUGGIES_CACHED_TOKEN } from "./token_cache";
import { HUGGIES_TOKEN_ICON_FIELDS } from "./app_page_discover_token_search";
// ========================================
// how many icons one request may ask for.
const HUGGIES_ICON_BATCH_SIZE = 300;
// ========================================
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
// fetch the icons for a set of token ids and cache them durably.
// --- WHY --- icons are NOT fetched with the token list. asking for the
// `icon` field on every indexed token costs ~21MB, because each icon
// is a full base64 data uri. instead the list is fetched without
// icons, and only the icons of the tokens actually on screen are
// fetched — and written into the durable per-token store, where they
// are read back on every later visit and never fetched again.
//
// --- WHY --- the request carries NO ids. a list of token ids is the
// worst thing to put in a url: a near account id is 64 hex characters
// and a token id adds a label on top, so 170 of them are already past
// the api's ~8KB url limit and the request is refused with a 414.
// the api can return a sorted page of tokens without any ids at all,
// and that is the same set of tokens the visible list is made of —
// the sort and the limit do the work the id list was doing.
//
// --- WHY --- the ids are still used for the leftovers. the sorted page
// covers the top N by one field, but the visible list may be ordered
// differently (the default view leads with the favourites, and a
// strict sort may be ascending), so a token can be on screen and yet
// outside the page. those few are fetched by id, over POST, whose body
// has a 64KB limit rather than a url limit.
export async function fetch_token_icons_fun(
  ids: ReadonlyArray<string>,
  sort?: { by: string; desc: boolean },
): Promise<Map<string, string>> {
  const wanted = [...new Set(ids)];
  const out = new Map<string, string>();
  if (wanted.length === 0) return out;

  // the ids we already know about cost nothing to serve.
  // --- WHY --- a CACHED record whose icon is null means the api
  // answered for that token and it has no icon. treating it as
  // "missing" made the page refetch on every single load: 23 of the
  // top 300 tokens have no icon at all, so those 23 were missing
  // forever and dragged the whole 300-token page with them. only a
  // token that is NOT in the cache at all is missing.
  const cached = await HUGGIES_TOKEN_CACHE.get_many(wanted);
  const missing = wanted.filter((id) => !cached.has(id));
  for (const [id, hit] of cached) {
    if (hit.icon !== null) out.set(id, hit.icon);
  }
  if (missing.length === 0) return out;

  // 1. the sorted page — no ids in the url at all.
  // `covered` tracks every id the page answered for, NOT only the ones
  // with an icon: a token with no icon is still answered, and asking
  // for it again by id would be a wasted request every single time.
  const covered = new Set<string>();
  if (sort !== undefined) {
    const response = await api_intear_tokens_get({
      fields: HUGGIES_TOKEN_ICON_FIELDS,
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
      fields: HUGGIES_TOKEN_ICON_FIELDS,
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
