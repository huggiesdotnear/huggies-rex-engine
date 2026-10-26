// ========================================
// the indexeddb cache for the discover token list.
// ========================================
import type { HUGGIES_TOKEN_SEARCH_RESULT } from "./token_search";
import {
  token_sort_cache_key_fun,
  type HUGGIES_TOKEN_SORT,
  type HUGGIES_TOKEN_SORT_DIRECTION,
} from "./token_sort";
// ========================================
const HUGGIES_TOKEN_LIST_DB_NAME = "huggies_token_list";
const HUGGIES_TOKEN_LIST_DB_VERSION = 1;
const HUGGIES_TOKEN_LIST_STORE = "lists";
// how long a cached list is served before it is refetched.
const HUGGIES_TOKEN_LIST_TTL_MS = 60 * 1000;
// ========================================
// one cached token list, keyed by the sort it was fetched in.
export interface HUGGIES_TOKEN_LIST_CACHE {
  key: string;
  fetched_at_millis: number;
  sort: HUGGIES_TOKEN_SORT;
  direction: HUGGIES_TOKEN_SORT_DIRECTION;
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
      if (!db.objectStoreNames.contains(HUGGIES_TOKEN_LIST_STORE)) {
        db.createObjectStore(HUGGIES_TOKEN_LIST_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return db_promise;
}
// ========================================
// read one cached token list.
export async function get_cached_token_list_fun(
  sort: HUGGIES_TOKEN_SORT,
  direction: HUGGIES_TOKEN_SORT_DIRECTION,
): Promise<HUGGIES_TOKEN_SEARCH_RESULT[] | null> {
  try {
    const db = await open_db_fun();
    return await new Promise<HUGGIES_TOKEN_SEARCH_RESULT[] | null>(
      (resolve) => {
        const request = db
          .transaction(HUGGIES_TOKEN_LIST_STORE, "readonly")
          .objectStore(HUGGIES_TOKEN_LIST_STORE)
          .get(token_sort_cache_key_fun(sort, direction));
        request.onsuccess = () => {
          const row = request.result as HUGGIES_TOKEN_LIST_CACHE | undefined;
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
    console.warn("[token_list_cache] read failed", err);
    return null;
  }
}
// ========================================
// replace one cached token list.
export async function put_cached_token_list_fun(
  sort: HUGGIES_TOKEN_SORT,
  direction: HUGGIES_TOKEN_SORT_DIRECTION,
  tokens: ReadonlyArray<HUGGIES_TOKEN_SEARCH_RESULT>,
): Promise<void> {
  try {
    const db = await open_db_fun();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(HUGGIES_TOKEN_LIST_STORE, "readwrite");
      tx.objectStore(HUGGIES_TOKEN_LIST_STORE).put({
        key: token_sort_cache_key_fun(sort, direction),
        fetched_at_millis: Date.now(),
        sort,
        direction,
        tokens,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn("[token_list_cache] write failed", err);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
