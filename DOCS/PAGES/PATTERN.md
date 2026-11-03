# PAGE PATTERN

how every page that has data is built. one shape for all of them.

## the files

```
lib/ts/<page>/<page>_*.ts   the ts, in a FOLDER PER PAGE. one folder
                            holds everything that page owns: its
                            FETCHING (every request the page makes —
                            read this file to know what the page
                            requests), its STORE (the data, and the load
                            that fills it — the store watches the
                            page's id, so it re-loads by itself when
                            the id changes) and its START (the page's
                            first load, which the page's import file
                            pulls in). a page under `app/contract/` has
                            its folder at `lib/ts/contract/<page>/`, a
                            page under `app/token/` at
                            `lib/ts/token/<page>/`.
lib/ts/shared/              the shared ts. the ts more than one page
                            uses: the hooks, the loading signal, the
                            store hook.
lib/ts/import-<page>.ts  the page's ONE ENTRY. the page's html loads
                          this file and nothing else. its import order
                          is the page's order of life: the network pin,
                          then the page's start, then the components.
lib/ts/shared/use_page_store.ts
                          the shared HOOK. one line per component.
lib/ts/shared/use_scroll_load.ts
                          the shared HOOK for a paged list. it asks
                          for the next page when the reader nears the
                          bottom of the scroll box.
lib/ts/shared/loading_bar.ts
                          the app-wide LOADING SIGNAL. how much of the
                          page is still waiting. every page uses it.
lib/ts/shared/loading_bar_start.ts
                          the one line every start script calls first,
                          so the loading signal is in place before the
                          page fires its first request.

lib/components/<page>/<page>_*.tsx
                          the DISPLAY, in a FOLDER PER PAGE, mirroring
                          lib/ts. each component reads the store
                          through the hook and renders jsx. a page
                          under `app/contract/` has its folder at
                          `lib/components/contract/<page>/`, a page
                          under `app/token/` at
                          `lib/components/token/<page>/`.
lib/components/app-wide/  the app-wide components: the loading PROGRESS
                          BAR, the nav and the auth button. they are on
                          every page and belong to no one page.
lib/components/shared/    the components more than one page uses. they
                          keep a plain name.

lib/css/import-<page>.css the page's ONE css entry. it holds only
                          import statements, and it lists the page's
                          components in the same order as the page's ts
                          entry file.
lib/css/components/<page>/
                          the page's component css, mirroring
                          lib/components/. one file per component,
                          named after its mount id.
lib/css/components/shared/
                          the css of the shared components, named after
                          their tsx file.
lib/css/base/           the base css, one file per element.
```

## the loading signal

the bar at the top of the screen is not a per-page thing. it is fed by
one module, `lib/ts/shared/loading_bar.ts`, and every page gets it for free.

the module patches the one global `fetch`, so it counts EVERY request
the page makes — the page's own loader, the token metadata cache, the
next page of a list, a search, a sort. that is why a page does not have
to tell the bar anything: the bar watches the network.

the token icons are NOT counted. they are `<img>` tags and the browser
loads them itself, but they are decoration: the rows are readable
without them, and a discover page asks for up to three hundred of them
against ONE api call for the data itself. counting them would make the
bar measure the pictures instead of the page's work.

the bar has three states:

- **idle** — nothing is happening. the bar is dark.
- **loading** — work is on its way. the bar sweeps.
- **done** — the work just finished. the sweep is shown for a moment
  and then the bar rests with the fill at the end.

the bar's TRACK is always there — a constant dark line across the top
of every page, so the app looks the same everywhere and the reader
always knows where the progress appears. only the blue FILL comes and
goes with the work:

- a page that fetches nothing shows the dark track alone
- a page that is loading shows the fill sweeping across the track
- a page that has loaded shows the track with the blue fill at the end

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

a page's html loads ONE file — the page's own `import-<page>.ts`:

```html
<script src="../lib/ts/import-discover.ts"></script>
```

that file is the page's whole entry, and the order of its imports IS the
order of the page's life:

```ts
import "./import-app-wide"; // the network pin + the app-wide three
import "./discover/app_page_discover_start"; // the page's first load
import "../components/discover/app_page_discover_token_discover"; // the components
```

the pin lands first, because the pin has to be in place before anything
reads the network. the start comes next, so the page fires its first
request before the bar's component has even mounted. every start script
therefore calls `shit_1170_loading_bar_start_fun()` as its first line,
which puts the patch on the global fetch in place before the page's load
runs. without that line the page's FIRST load was never counted and the
bar sat dark through it. the components come last, so they mount against
the data the load brought back.

### the batch

the bar runs once per BATCH of work. a batch is the page's load, or a
later action of the reader's — a search, a sort, the next page of a
list. a batch opens when a request arrives after the page has been quiet
for a moment, and it closes when the page goes quiet again. the bar
sweeps from the left on each new batch.

## a paged list

a list that is longer than one page asks for the next page when the
reader nears the bottom of its scroll box. there is no button.

three lists work this way and they all use the same hook,
`lib/ts/shared/use_scroll_load.ts`:

- the discover page's token list
- the token page's holders
- the $SHIT page's holders

the hook owns the scroll listener, the threshold and the "is there
another page" question. a list only says WHAT to load:

```tsx
use_scroll_load_fun(scroll_ref, has_more, loading, load_more_fun);
```

the scroll box has to be a `ref` on the element the reader scrolls, and
the element needs a max-height and `overflow-y: auto` for the scroll to
happen at all.

--- the hook also asks for the next page when the rows do not fill the
box. a list shorter than its box has no scrollbar, so no scroll event
would ever fire and the next page would never be asked for. that
happens when a filter narrows the rows.

## the rules

1. **the ts files fetch, the components display.** no component fetches
   the page's data. a component that needs a follow-up action (the next
   page of a list, a search, a sort) calls the loader `.ts` file for it.

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
function SHIT_1170_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE_FUN() {
  const page_data = use_page_store_fun(SHIT_1170_APP_PAGE_ACCOUNT_STORE);
  if (page_data === null) return null;
  return <>{shit_1170_balance_table_fun({ rows: page_data.direct })}</>;
}
```

one line to read the data, then jsx. that is the whole pattern.

## the store

```ts
// the store subscribes to the page's id, so it re-loads by itself.
export const SHIT_1170_APP_PAGE_ACCOUNT_STORE = {
  get: get_fun,
  subscribe: subscribe_fun,
  load: load_fun,
};
```

## the start script

```ts
// the page's first load.
void SHIT_1170_APP_PAGE_ACCOUNT_STORE.load();
```

## the html

```html
<main>
  <div id="SHIT_1170_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE"></div>
</main>
<script src="../lib/ts/import-account.ts"></script>
```

=====================
<br/>
copyright 2026 by sleet.near
