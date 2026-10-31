# PAGE PATTERN

how every page that has data is built. one shape for all of them.

## the files

```
lib/ts/<page>.ts          the FETCHING. every request the page makes.
                          read this file to know what the page requests.
lib/ts/<page>_state.ts    the STORE. the data, and the load that fills
                          it. the store watches the page's id, so it
                          re-loads by itself when the id changes.
lib/ts/<page>_start.ts    the START. the page's first load. the page's
                          html loads it as a <script>.
lib/ts/use_page_store.ts  the shared HOOK. one line per component.
lib/ts/loading_bar.ts     the app-wide LOADING SIGNAL. how much of the
                           page is still waiting. every page uses it.

lib/components/<page>_*.tsx   the DISPLAY. each one reads the store
                              through the hook and renders jsx.
lib/components/loading_bar.tsx the loading PROGRESS BAR. it is on every
                              page and it reads the loading signal.
```

## the loading signal

the bar at the top of the screen is not a per-page thing. it is fed by
one module, `lib/ts/loading_bar.ts`, and every page gets it for free.

the module patches the one global `fetch`, so it counts EVERY request
the page makes — the page's own loader, the token metadata cache, the
icon loader, a LOAD MORE, a search, a sort. that is why a page does
not have to tell the bar anything: the bar watches the network.

the bar fills as the answers land. it shows the share of the requests
that are DONE, so it creeps forward while the work is running and
reaches the end only when the last answer is in.

a page that wants to know whether something is running asks the signal
(`HUGGIES_LOADING_BAR.is_loading()`); it never counts requests itself.

## the rules

1. **the ts files fetch, the components display.** no component fetches
   the page's data. a component that needs a follow-up action (LOAD
   MORE, search, sort) calls the loader `.ts` file for it.

2. **one `.ts` file holds the fetching.** the page's request list is
   knowable by reading that one file.

3. **the store owns the load.** `load()` starts it, `get()` reads it,
   `subscribe()` lets the components follow it. every page's store has
   those three, so the shared hook drives any of them.

4. **the store holds the page's id.** `get_account_id()` /
   `get_token_id()` read it, so the components have one place to read
   from — the id and the data always change together, and the store is
   what tells the components to re-render.

5. **the store re-loads when the page's id changes.** the id comes from
   a module that owns the rule — `?id=` on the url wins, the signed-in
   account is the fallback, and the module notifies when the id
   changes. the store subscribes to that (`watch()`), so a sign-in, a
   sign-out or a jump box reloads the page by itself. no component has
   to watch for it.

6. **the start script is the page's first load.** it runs when the html
   is parsed, before the components mount. it is the page saying "go",
   not a component doing two jobs.

## a component

```tsx
function HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE_FUN() {
  const page_data = use_page_store_fun(HUGGIES_APP_PAGE_ACCOUNT_STORE);
  if (page_data === null) return null;
  return <>{huggies_balance_table_fun({ rows: page_data.direct })}</>;
}
```

one line to read the data, then jsx. that is the whole pattern.

## the store

```ts
// the store subscribes to the page's id, so it re-loads by itself.
export const HUGGIES_APP_PAGE_ACCOUNT_STORE = {
  get: get_fun,
  subscribe: subscribe_fun,
  load: load_fun,
};
```

## the start script

```ts
// the page's first load.
void HUGGIES_APP_PAGE_ACCOUNT_STORE.load();
```

## the html

```html
<main>
  <div id="HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE"></div>
</main>
<script src="../lib/ts/app_page_account_start.ts"></script>
<script src="../lib/ts/import.ts"></script>
```

=====================
<br/>
copyright 2026 by sleet.near
