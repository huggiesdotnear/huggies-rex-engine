// a browser that visited the OLD discover page has a `lists` store in
// huggies_token_list (db version 1). the code now uses db version 2
// with a `tokens` store. does the old store linger?
import { Window } from "happy-dom";
const win = new Window({ url: "https://example.test/" });
const g = globalThis as unknown as Record<string, unknown>;
g.window = win; g.navigator = win.navigator;
const f = await import("fake-indexeddb");
g.indexedDB = f.indexedDB as unknown as IDBFactory;

// simulate the OLD version: db v1 with a `lists` store
await new Promise<void>((res) => {
  const rq = indexedDB.open("huggies_token_list", 1);
  rq.onupgradeneeded = () => {
    rq.result.createObjectStore("lists", { keyPath: "key" });
  };
  rq.onsuccess = () => res();
});

// now open it the way the current code does: v2
const db = await new Promise<IDBDatabase>((res) => {
  const rq = indexedDB.open("huggies_token_list", 2);
  rq.onupgradeneeded = () => {
    const d = rq.result;
    if (!d.objectStoreNames.contains("tokens")) d.createObjectStore("tokens", { keyPath: "key" });
  };
  rq.onsuccess = () => res(rq.result);
});
console.log("stores after upgrade:", [...db.objectStoreNames].join(", "));
console.log("=> the old 'lists' store lingers, holding stale per-sort copies.");
console.log("   it is never read, but it never gets cleaned up either.");
