// ========================================
// the durable, never-expiring half of token metadata: symbol,
// decimals, icon. a tokens object store holds one entry per token id
// so any page or component can read metadata without refetching.
// volatile data (price_usd, reputation) is deliberately NOT cached —
// it moves constantly and is refetched on each load. see
// lib/ts/token_info.ts for the read-through path that combines the two.
const HUGGIES_TOKEN_DB_NAME = "huggies_tokens";
const HUGGIES_TOKEN_DB_VERSION = 1;
const HUGGIES_TOKEN_STORE = "tokens";
// ========================================
// ========================================
// --- SHAPE ------------------------------
// one row in the tokens store. keyed by `id`. these are the fields
// that do not change for the life of a token.
export interface HUGGIES_CACHED_TOKEN {
  id: string;
  symbol: string;
  decimals: number;
  icon: string | null;
}
// ========================================
// ========================================
// --- CONNECTION ------------------------
// open (and upgrade) the database once per page, cached on the
// promise so concurrent callers share one connection.
// --- WHY --- idb-style `onupgradeneeded` fires only on first open or
// a version bump, so the store is created exactly once; caching the
// promise avoids a second open request on a rapid second call.
let db_promise: Promise<IDBDatabase> | null = null;
// ========================================
// open the database, creating the tokens store on first use.
function open_db_fun(): Promise<IDBDatabase> {
  if (db_promise !== null) return db_promise;
  db_promise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(HUGGIES_TOKEN_DB_NAME, HUGGIES_TOKEN_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // only create when missing, so a future version bump that adds
      // stores does not throw on the ones already here.
      if (!db.objectStoreNames.contains(HUGGIES_TOKEN_STORE)) {
        db.createObjectStore(HUGGIES_TOKEN_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return db_promise;
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
  try {
    const db = await open_db_fun();
    return await new Promise<HUGGIES_CACHED_TOKEN | null>((resolve) => {
      const request = db
        .transaction(HUGGIES_TOKEN_STORE, "readonly")
        .objectStore(HUGGIES_TOKEN_STORE)
        .get(id);
      request.onsuccess = () => resolve((request.result as HUGGIES_CACHED_TOKEN) ?? null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("[token_cache] read failed, falling back to fetch", err);
    return null;
  }
}
// ========================================
// look up many ids at once. missing ids are simply absent from the
// returned map, which is the caller's signal to fetch them.
// --- WHY --- resolves on the readwrite transaction's `oncomplete`, not a
// timeout and not each request: `readonly` transactions do not fire
// `oncomplete` reliably across browsers, so the transaction is opened
// readwrite purely to get that one completion signal. a timeout-based
// resolve can fire before the queued gets have settled and silently
// drop rows.
async function get_cached_tokens_fun(
  ids: ReadonlyArray<string>,
): Promise<Map<string, HUGGIES_CACHED_TOKEN>> {
  const found = new Map<string, HUGGIES_CACHED_TOKEN>();
  if (ids.length === 0) return found;
  try {
    const db = await open_db_fun();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(HUGGIES_TOKEN_STORE, "readwrite");
      const store = tx.objectStore(HUGGIES_TOKEN_STORE);
      for (const id of ids) {
        const request = store.get(id);
        request.onsuccess = () => {
          const row = request.result as HUGGIES_CACHED_TOKEN | undefined;
          if (row !== undefined) found.set(id, row);
        };
        // individual misses are expected (that is the point) — only a
        // hard failure ends the wait, via the completion signal.
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn("[token_cache] batch read failed, falling back to fetch", err);
  }
  return found;
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// upsert many tokens in one transaction. never throws: a failed cache
// write only costs a refetch next time.
async function put_cached_tokens_fun(
  tokens: ReadonlyArray<HUGGIES_CACHED_TOKEN>,
): Promise<void> {
  if (tokens.length === 0) return;
  try {
    const db = await open_db_fun();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(HUGGIES_TOKEN_STORE, "readwrite");
      const store = tx.objectStore(HUGGIES_TOKEN_STORE);
      for (const token of tokens) store.put(token);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn("[token_cache] write failed", err);
  }
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