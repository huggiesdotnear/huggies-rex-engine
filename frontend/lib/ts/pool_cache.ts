// ========================================
// indexeddb pool cache: one store per supported dex, holding every pool.
// ========================================
import {
  HUGGIES_POOL_CACHE_TTL_MS,
  HUGGIES_POOL_STORE_NAMES,
  type HUGGIES_POOL,
  type HUGGIES_POOL_CACHE,
  type HUGGIES_POOL_DEX,
} from "./pool";
// ========================================
const HUGGIES_POOL_DB_NAME = "huggies_pools";
const HUGGIES_POOL_DB_VERSION = 3;
const HUGGIES_POOL_CACHE_KEY = "cache";
let pool_db_promise: Promise<IDBDatabase> | null = null;
// ========================================
// open the pool database and create each dex pool store on first use.
function open_pool_db_fun(): Promise<IDBDatabase> {
  if (pool_db_promise !== null) return pool_db_promise;
  pool_db_promise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(
      HUGGIES_POOL_DB_NAME,
      HUGGIES_POOL_DB_VERSION,
    );
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store_name of Object.values(HUGGIES_POOL_STORE_NAMES)) {
        if (!db.objectStoreNames.contains(store_name)) {
          db.createObjectStore(store_name, { keyPath: "key" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return pool_db_promise;
}
// ========================================
// read one dex's cached pool collection, with its metadata.
export async function get_cached_pools_fun(
  dex: HUGGIES_POOL_DEX,
): Promise<HUGGIES_POOL_CACHE | null> {
  try {
    const db = await open_pool_db_fun();
    const store_name = HUGGIES_POOL_STORE_NAMES[dex];
    return await new Promise<HUGGIES_POOL_CACHE | null>((resolve) => {
      const request = db
        .transaction(store_name, "readonly")
        .objectStore(store_name)
        .get(HUGGIES_POOL_CACHE_KEY);
      request.onsuccess = () => {
        const row = request.result as HUGGIES_POOL_CACHE | undefined;
        if (row === undefined || typeof row.fetched_at_millis !== "number") {
          resolve(null);
          return;
        }
        resolve(row);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("[pool_cache] read failed", err);
    return null;
  }
}
// ========================================
// replace one dex's cached pool collection and timestamp.
export async function put_cached_pools_fun(
  dex: HUGGIES_POOL_DEX,
  pools: ReadonlyArray<HUGGIES_POOL>,
  total_pools: number,
): Promise<void> {
  try {
    const db = await open_pool_db_fun();
    const store_name = HUGGIES_POOL_STORE_NAMES[dex];
    await new Promise<void>((resolve) => {
      const tx = db.transaction(store_name, "readwrite");
      const store = tx.objectStore(store_name);
      store.clear();
      store.put({
        key: HUGGIES_POOL_CACHE_KEY,
        fetched_at_millis: Date.now(),
        total_pools,
        cached_pools: pools.length,
        pools,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn("[pool_cache] write failed", err);
  }
}
// ========================================
// tell whether a cached collection is stale and needs a refresh.
export function pool_cache_is_stale_fun(
  cache: HUGGIES_POOL_CACHE,
): boolean {
  return (
    Date.now() - cache.fetched_at_millis >= HUGGIES_POOL_CACHE_TTL_MS ||
    cache.cached_pools < cache.total_pools
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
