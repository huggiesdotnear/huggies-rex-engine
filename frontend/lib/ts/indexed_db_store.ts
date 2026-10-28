// ========================================
// one indexeddb store, used by every durable cache in the app.
//
// --- WHY --- the token cache and the discover token-list cache each
// carried their own copy of the same four things: an open helper, a
// cached connection promise, a batch read and a batch write. they
// drifted apart, and the subtle parts — the readwrite-transaction
// trick that makes `oncomplete` fire — were duplicated by hand, so a
// fix to one had to be remembered in the other.
//
// this module holds that logic ONCE. a cache is described by its
// database name, version and store name, and everything else — open,
// batch get, batch put — comes from here.
//
// the open/upgrade behaviour:
//   * `onupgradeneeded` fires only on the first open or a version
//     bump, so the store is created exactly once.
//   * the connection promise is cached, so a second caller shares the
//     open request instead of making another one.
//   * the store is only created when missing, so a later version bump
//     that adds stores does not throw on the ones already there.
//
// every function here is safe to call outside a browser: it resolves
// empty / no-ops rather than throwing, so a caller never has to guard.
// ========================================

// ========================================
// --- SHAPE ------------------------------
// a cache's identity. the store's key path is `id` for every cache in
// the app, so `key_path` is fixed here rather than per-cache.
export interface HUGGIES_INDEXED_DB_STORE_CONFIG {
  // the database name.
  db_name: string;
  // the schema version. bump it to add or drop a store.
  db_version: number;
  // the object store name inside the database.
  store_name: string;
}
// ========================================
// ========================================
// --- CONNECTION ------------------------
// the open connection, cached on the promise so concurrent callers
// share one open request.
let db_promise: Promise<IDBDatabase> | null = null;
// ========================================
// ========================================
// --- OPEN ------------------------------
// open the database, creating the store on first use.
function open_db_fun(
  config: HUGGIES_INDEXED_DB_STORE_CONFIG,
): Promise<IDBDatabase> {
  if (db_promise !== null) return db_promise;
  db_promise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(config.db_name, config.db_version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(config.store_name)) {
        db.createObjectStore(config.store_name, { keyPath: "id" });
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
// look up many ids at once. ids that are not cached are simply absent
// from the returned map, which is the caller's signal to fetch them.
//
// --- WHY --- resolves on the readwrite transaction's `oncomplete`, not
// on a timeout and not per request: `readonly` transactions do not
// fire `oncomplete` reliably across browsers, so the transaction is
// opened readwrite purely to get that one completion signal. a
// timeout-based resolve can fire before the queued gets have settled
// and silently drop rows.
//
// --- WHY --- the whole read is wrapped in try/catch and every failure
// resolves empty rather than throwing: a cache problem must degrade
// to a refetch, never to an error the ui has to handle.
async function get_many_fun<row>(
  config: HUGGIES_INDEXED_DB_STORE_CONFIG,
  ids: ReadonlyArray<string>,
): Promise<Map<string, row>> {
  const found = new Map<string, row>();
  if (ids.length === 0) return found;
  try {
    const db = await open_db_fun(config);
    await new Promise<void>((resolve) => {
      const tx = db.transaction(config.store_name, "readwrite");
      const store = tx.objectStore(config.store_name);
      for (const id of ids) {
        const request = store.get(id);
        request.onsuccess = () => {
          const value = request.result as row | undefined;
          if (value !== undefined) found.set(id, value);
        };
        // individual misses are expected (that is the point) — only a
        // hard failure ends the wait, via the completion signal.
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn(
      "[indexed_db_store] batch read failed, falling back to fetch",
      err,
    );
  }
  return found;
}
// ========================================
// ========================================
// --- WRITE -----------------------------
// upsert many rows in one transaction. never throws: a failed cache
// write only costs a refetch next time.
async function put_many_fun<row>(
  config: HUGGIES_INDEXED_DB_STORE_CONFIG,
  rows: ReadonlyArray<row>,
): Promise<void> {
  if (rows.length === 0) return;
  try {
    const db = await open_db_fun(config);
    await new Promise<void>((resolve) => {
      const tx = db.transaction(config.store_name, "readwrite");
      const store = tx.objectStore(config.store_name);
      for (const row of rows) store.put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn("[indexed_db_store] write failed", err);
  }
}
// ========================================
// ========================================
// --- CLEAR -----------------------------
// empty a store. used when a cache's contents are no longer valid and
// must be refetched from scratch.
async function clear_fun(
  config: HUGGIES_INDEXED_DB_STORE_CONFIG,
): Promise<void> {
  try {
    const db = await open_db_fun(config);
    await new Promise<void>((resolve) => {
      const tx = db.transaction(config.store_name, "readwrite");
      tx.objectStore(config.store_name).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn("[indexed_db_store] clear failed", err);
  }
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the store surface. one call per operation, each one carrying the
// cache's own config, so two caches over the same database share the
// connection without sharing a store.
export const HUGGIES_INDEXED_DB_STORE = {
  get_many: get_many_fun,
  put_many: put_many_fun,
  clear: clear_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
