// ========================================
// the app-wide loading signal: how much of the page is still waiting.
//
// every page that fetches something shares this one module, so the
// progress bar at the top of the screen is the same on every page and
// nobody has to wire it up per page.
//
// WHY THIS EXISTS
// --- the pages used to show their own "LOADING ..." line inside the
// page's own component: the token page had a status component, the
// $SHIT page had another one, the account page had none at all. there
// was no single thing that knew "the page is fetching" — each page
// answered for itself, and a page with no status line just sat there
// looking broken.
//
// --- WHY THE FETCH IS PATCHED AND NOT THE STORES: the stores know
// when THEIR load is running, but the fetches that fill a page are
// made from many places — the page's own loader, the token metadata
// cache, the icon loader, the holder pager. patching the one global
// fetch catches every one of them, including the ones that run after
// the page's first paint (a search, a LOAD MORE, a sort change).
//
// --- WHY IT IS COUNTED AND NOT FLAGGED: a page often fetches several
// things at once (the account page asks four contracts in parallel).
// the bar shows the share of the work that is DONE, so it is a count of
// the requests in flight against the total that was asked for.
//
// the module is plain ts and holds no dom: the component in
// lib/components/loading_bar.tsx reads it and paints the bar.
//
// ========================================
// ========================================
// --- STATE ------------------------------
// how many requests are in flight right now.
let in_flight = 0;
// how many requests have been started in total, since the last reset.
let started = 0;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// true once the global fetch has been wrapped.
let patched = false;
// the fetch we replaced, kept so the wrapper can call the real one.
let real_fetch: typeof fetch | null = null;
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing cannot break the notify.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[loading_bar] listener failed", err);
    }
  }
}
// ========================================
// register a re-render callback; returns an unsubscribe to clean up.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// --- PROGRESS --------------------------
// the share of the work that is done, from 0 to 1.
//
// --- WHY the finished requests are counted and not the pending ones:
// a bar that fills as requests START would sit at 100% for as long as
// the slowest request runs, which is the opposite of what the reader
// wants to know. counting the finished ones means the bar creeps
// forward as each answer lands and only reaches the end when the last
// one has.
function get_progress_fun(): number {
  if (started === 0) return 0;
  const done = started - in_flight;
  if (done <= 0) return 0;
  const ratio = done / started;
  if (ratio >= 1) return 1;
  return ratio;
}
// ========================================
// true while at least one request is in flight.
function is_loading_fun(): boolean {
  return in_flight > 0;
}
// ========================================
// how many requests are in flight right now.
function get_in_flight_fun(): number {
  return in_flight;
}
// ========================================
// --- PATCH ------------------------------
// wrap the global fetch so every request is counted.
//
// --- WHY the count is bumped AROUND the await and not inside it: the
// request is in flight from the moment fetch is called until its body
// has been read, and a response that is never read leaves the request
// in flight forever.
async function counted_fetch_fun(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  in_flight += 1;
  started += 1;
  notify_fun();
  try {
    // --- WHY the response is read here: the reader only counts the
    // request as done once the body is in, so the bar never says
    // "done" while the page is still waiting for the bytes.
    const response = await (real_fetch as typeof fetch)(input, init);
    return response;
  } finally {
    in_flight -= 1;
    notify_fun();
  }
}
// ========================================
// wrap the global fetch once. a second call does nothing, so the
// module can be imported from anywhere without double counting.
function install_fun(): void {
  if (patched) return;
  if (typeof globalThis.fetch !== "function") return;
  patched = true;
  real_fetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = counted_fetch_fun as typeof fetch;
}
// ========================================
// --- RESET -----------------------------
// forget the counts. used when the page changes what it is loading, so
// the bar restarts from zero for the new work.
function reset_fun(): void {
  in_flight = 0;
  started = 0;
  notify_fun();
}
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_LOADING_BAR = {
  install: install_fun,
  reset: reset_fun,
  subscribe: subscribe_fun,
  get_progress: get_progress_fun,
  get_in_flight: get_in_flight_fun,
  is_loading: is_loading_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
