// ========================================
// the indexeddb cache for the discover token list.
// ========================================
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./token_search";
// ========================================
const HUGGIES_TOKEN_LIST_DB_NAME = "huggies_token_list";
const HUGGIES_TOKEN_LIST_DB_VERSION = 2;
// the full sortable token set. one snapshot of every token, NOT one
// per sort: sorting happens in javascript, so a second cached copy per
// sort field would be 7,355 rows stored twice for nothing.
const HUGGIES_TOKEN_SET_STORE = "tokens";
// the one key the full token set is stored under.
const HUGGIES_TOKEN_SET_KEY = "all";
// how long a cached list is served before it is refetched. the volume
// and market cap numbers in it move, so it cannot be kept forever —
// but it also must not be refetched on every visit, hence a short ttl
// rather than the durable per-token cache.
const HUGGIES_TOKEN_LIST_TTL_MS = 5 * 60 * 1000;
// ========================================
// the cached full token set, with the time it was fetched.
export interface HUGGIES_TOKEN_SET_CACHE {
  key: string;
  fetched_at_millis: number;
  tokens: HUGGIES_TOKEN_SEARCH_RESULT[];
}
// ========================================
let db_promise: Promise<IDBDatabase> | null = null;
// ========================================
// open the token-list database and create its store on first use.
function open_db_fun(): Promise<IDBDatabase> {
  if (db_promise !== null) return db_promise;
  db_promise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(
      HUGGIES_TOKEN_LIST_DB_NAME,
      HUGGIES_TOKEN_LIST_DB_VERSION,
    );
    request.onupgradeneeded = () => {
      const db = request.result;
      // only create when missing, so a future version bump that adds
      // stores does not throw on the ones already here.
      if (!db.objectStoreNames.contains(HUGGIES_TOKEN_SET_STORE)) {
        db.createObjectStore(HUGGIES_TOKEN_SET_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return db_promise;
}
// ========================================
// read the cached full token set, or null when it is missing or stale.
export async function get_cached_token_set_fun(): Promise<
  HUGGIES_TOKEN_SEARCH_RESULT[] | null
> {
  try {
    const db = await open_db_fun();
    return await new Promise<HUGGIES_TOKEN_SEARCH_RESULT[] | null>(
      (resolve) => {
        const request = db
          .transaction(HUGGIES_TOKEN_SET_STORE, "readonly")
          .objectStore(HUGGIES_TOKEN_SET_STORE)
          .get(HUGGIES_TOKEN_SET_KEY);
        request.onsuccess = () => {
          const row = request.result as HUGGIES_TOKEN_SET_CACHE | undefined;
          if (
            row === undefined ||
            typeof row.fetched_at_millis !== "number" ||
            Date.now() - row.fetched_at_millis >= HUGGIES_TOKEN_LIST_TTL_MS
          ) {
            resolve(null);
            return;
          }
          resolve(row.tokens ?? []);
        };
        request.onerror = () => resolve(null);
      },
    );
  } catch (err) {
    console.warn("[token_list_cache] set read failed", err);
    return null;
  }
}
// ========================================
// replace the cached full token set.
export async function put_cached_token_set_fun(
  tokens: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
): Promise<void> {
  try {
    const db = await open_db_fun();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(HUGGIES_TOKEN_SET_STORE, "readwrite");
      tx.objectStore(HUGGIES_TOKEN_SET_STORE).put({
        key: HUGGIES_TOKEN_SET_KEY,
        fetched_at_millis: Date.now(),
        tokens,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn("[token_list_cache] set write failed", err);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
