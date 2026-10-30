// ========================================
// the symbols and icons of the tokens on a dex pool list.
//
// the dex apis name their tokens by id only — `nep141:token.x.near` —
// and the symbols live in the intear token indexer, which is a
// different api. this module asks that api once for the whole list and
// hands back a symbol and an icon per token id.
//
// it uses the app's durable token cache first, so a token the app has
// already seen costs nothing.
//
// it is its own module because BOTH dex pages need it and it is
// neither of theirs: a shared file keeps its own plain name.
// ========================================
import { api_intear_tokens_get } from "@sleet-js/middleman-intear-api";
import { HUGGIES_TOKEN_CACHE } from "./token_cache";
import { icon_hash_of_fun, token_icon_for_fun } from "./token_icon_url";
import {
  HUGGIES_NEAR_ID,
  HUGGIES_NEAR_SYMBOL,
  HUGGIES_WRAP_ID,
} from "./token_near";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the fields the symbol request needs. `icon_hash` and not `icon`: the
// icon field is a full inline data uri, and the hash is 16 characters
// pointing at a content-addressed url the browser caches for a year.
// see lib/ts/token_icon_url.ts.
const HUGGIES_SYMBOL_FIELDS = ["symbol", "decimals", "icon_hash"] as const;
// how many ids one request may ask for. the api's url is limited, so
// the ids go in chunks.
const HUGGIES_SYMBOL_BATCH_SIZE = 100;
// ========================================
// ========================================
// --- TYPES ------------------------------
// what the pool list needs to know about one token.
export interface HUGGIES_POOL_TOKEN {
  // the token's display symbol.
  symbol: string;
  // the token's icon url, or null when it has none.
  icon: string | null;
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
// ========================================
// --- FETCH -----------------------------
// the symbols and icons of a set of token ids.
//
// --- WHY --- the cache is read FIRST, and only the misses are
// fetched: a token the app has already seen costs no network at all,
// and a token the api answered for with no icon is a token with no
// icon — asking for it again every load would be a wasted request
// forever.
//
// --- WHY --- the misses go over POST: a token id list does not fit in
// the api's ~8KB url limit, and the POST body limit is 64KB.
async function fetch_pool_tokens_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, HUGGIES_POOL_TOKEN>> {
  const out = new Map<string, HUGGIES_POOL_TOKEN>();
  const wanted = [...new Set(ids)];
  if (wanted.length === 0) return out;

  // --- WHY --- the chain's own token is asked for with wNEAR: the
  // registry has no `near` entry — it comes back in the response's
  // `missing` list — so it can never be fetched and never cached. the
  // 1:1 wrapper stands in for it, exactly as it does everywhere else
  // in the app (see token_info.ts): wNEAR's icon IS the NEAR logo, not
  // a lookalike.
  const wants_near = wanted.includes(HUGGIES_NEAR_ID);
  const asked = wants_near
    ? [...new Set([...wanted, HUGGIES_WRAP_ID])]
    : wanted;

  const cached = await HUGGIES_TOKEN_CACHE.get_many(asked);
  for (const [id, record] of cached) {
    out.set(id, {
      symbol: record.symbol,
      icon: token_icon_for_fun(id, record.icon_hash),
    });
  }

  // the ids the cache has never stored. a cached record with a null
  // icon hash IS known — the api answered for it and it has no icon —
  // so it is not a miss.
  const missing = asked.filter(
    (id) => id !== HUGGIES_NEAR_ID && !cached.has(id),
  );
  if (missing.length > 0) {
    for (
      let start = 0;
      start < missing.length;
      start += HUGGIES_SYMBOL_BATCH_SIZE
    ) {
      const batch = missing.slice(start, start + HUGGIES_SYMBOL_BATCH_SIZE);
      try {
        const response = await api_intear_tokens_get({
          fields: HUGGIES_SYMBOL_FIELDS,
          ids: batch,
        });
        const columns = response.columns;
        const id_at = columns.indexOf("account_id");
        const symbol_at = columns.indexOf("symbol");
        const decimals_at = columns.indexOf("decimals");
        const hash_at = columns.indexOf("icon_hash");
        const records = [];
        for (const row of response.rows) {
          const id = String(id_at >= 0 ? row[id_at] : row[0]);
          const symbol = symbol_at >= 0 ? row[symbol_at] : row[1];
          const decimals = decimals_at >= 0 ? row[decimals_at] : row[2];
          const hash = hash_at >= 0 ? row[hash_at] : row[3];
          const record = {
            id,
            symbol:
              typeof symbol === "string" && symbol.length > 0 ? symbol : id,
            decimals: to_finite_number_fun(decimals),
            icon_hash: icon_hash_of_fun(hash),
          };
          records.push(record);
          out.set(id, {
            symbol: record.symbol,
            icon: token_icon_for_fun(id, record.icon_hash),
          });
        }
        await HUGGIES_TOKEN_CACHE.put_many(records);
      } catch {
        // a failed symbol request costs the labels, not the page: the
        // rows fall back to the token id.
      }
    }
  }

  // the chain's own token borrows wNEAR's icon, the same way it does
  // in the balance tables and the token pages.
  if (wants_near) {
    const wrap = out.get(HUGGIES_WRAP_ID);
    out.set(HUGGIES_NEAR_ID, {
      symbol: HUGGIES_NEAR_SYMBOL,
      icon: wrap?.icon ?? null,
    });
  }
  return out;
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_POOL_TOKENS = {
  fetch: fetch_pool_tokens_fun,
};
// ========================================
// copyright 2026 by sleet.near
