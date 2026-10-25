// ========================================
// indexeddb pool cache with one object store per supported dex.
// ========================================
import {
  HUGGIES_POOL_STORE_NAMES,
  type HUGGIES_POOL,
  type HUGGIES_POOL_CACHE,
  type HUGGIES_POOL_DEX,
} from "./pool";
// ========================================
const HUGGIES_POOL_DB_NAME = "huggies_pools";
const HUGGIES_POOL_DB_VERSION = 2;
const HUGGIES_POOL_CACHE_TTL_MS = 5 * 60 * 1000;
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
// read fresh cached pools for one dex.
export async function get_cached_pools_fun(
  dex: HUGGIES_POOL_DEX,
): Promise<HUGGIES_POOL[]> {
  try {
    const db = await open_pool_db_fun();
    const store_name = HUGGIES_POOL_STORE_NAMES[dex];
    return await new Promise<HUGGIES_POOL[]>((resolve) => {
      const request = db
        .transaction(store_name, "readonly")
        .objectStore(store_name)
        .get(HUGGIES_POOL_CACHE_KEY);
      request.onsuccess = () => {
        const row = request.result as HUGGIES_POOL_CACHE | undefined;
        if (
          row === undefined ||
          typeof row.fetched_at_millis !== "number" ||
          Date.now() - row.fetched_at_millis >= HUGGIES_POOL_CACHE_TTL_MS
        ) {
          resolve([]);
          return;
        }
        resolve(row.pools ?? []);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn("[pool_cache] read failed", err);
    return [];
  }
}
// ========================================
// replace one dex's cached pool collection and timestamp.
export async function put_cached_pools_fun(
  dex: HUGGIES_POOL_DEX,
  pools: ReadonlyArray<HUGGIES_POOL>,
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
// copyright 2026 by sleet.near
// ========================================
