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
lib/ts/page_loading_bar_start.ts
                          the one line every start script calls first,
                          so the loading signal is in place before the
                          page fires its first request.
lib/ts/loading_bar.test.ts the signal's RULES, as checks. the rules
                          were wrong three times while the bar was
                          being built; these lock them in.

lib/components/<page>_*.tsx   the DISPLAY. each one reads the store
                              through the hook and renders jsx.
lib/components/loading_bar.tsx the loading PROGRESS BAR. it is on every
                              page and it reads the loading signal.
```

## the loading signal

the bar at the top of the screen is not a per-page thing. it is fed by
one module, `lib/ts/loading_bar.ts`, and every page gets it for free.

the module patches the one global `fetch`, so it counts EVERY request
the page makes — the page's own loader, the token metadata cache, a
LOAD MORE, a search, a sort. that is why a page does not have to tell
the bar anything: the bar watches the network.

the token icons are NOT counted. they are `<img>` tags and the browser
loads them itself, but they are decoration: the rows are readable
without them, and a discover page asks for up to three hundred of them
against ONE api call for the data itself. counting them would make the
bar measure the pictures instead of the page's work.

the bar has three states:

- **idle** — nothing is happening. the bar is hidden.
- **loading** — work is on its way. the bar sweeps.
- **done** — the work just finished. the sweep is shown for a moment
  and then the bar goes away.

a bar that rested at 100% forever would read as "still loading" to
anyone glancing at it, and it would cover the top of the page
permanently. so the bar comes and goes with the work.

### the bar moves while it waits

the bar's position is where it is GOING, not where the work has got to.
a page that asks four things in parallel cannot know how long any of
them will take, so a bar that only moved when an answer landed sat at
zero for the whole of the slowest request and then jumped to the end —
the reader saw nothing happen.

so the bar CREEPS toward its target on a timer. the target is the
share of the work that is finished, plus most of the share that is
still running, so there is always somewhere for the bar to go. the bar
moves a share of the remaining distance each tick, so it slows down as
it approaches and eases into its target.

the last answer covers the final stretch at once, so the reader sees
the sweep FINISH rather than have it crawl the last tenth.

### the order of the scripts

a page's html loads its start script BEFORE the shared import:

```html
<script src="../lib/ts/app_page_discover_start.ts"></script>
<script src="../lib/ts/import.ts"></script>
```

so the start script fires the page's first request before the bar's
component has even mounted. every start script therefore calls
`huggies_loading_bar_start_fun()` as its first line, which puts the
patch on the global fetch in place before the page's load runs. without
that line the page's FIRST load was never counted and the bar sat dark
through it.

### the batch

the bar runs once per BATCH of work. a batch is the page's load, or a
later action of the reader's — a search, a sort, a LOAD MORE. a batch
opens when a request arrives after the page has been quiet for a moment,
and it closes when the page goes quiet again. the bar sweeps from the
left on each new batch.

### the rules are checked

`lib/ts/loading_bar.test.ts` holds the rules as checks. it needs a
slow server so a request can be seen in flight — see the top of that
file. the checks that need it are skipped when it is not running.



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
