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
// --- WHY IMAGES ARE COUNTED TOO: the token icons are NOT fetched with
// fetch. they are <img> tags pointing at the api's content-addressed
// icon urls, and the browser loads them on its own. a discover page
// asks for a couple of hundred of them, and they are the last thing
// the reader waits for. counting only fetch left the bar sitting at
// 100% while the icons were still streaming in.
//
// the module is plain ts and holds no dom: the component in
// lib/components/loading_bar.tsx reads it and paints the bar.
//
// ========================================
// ========================================
// --- STATE ------------------------------
// how many requests are in flight right now.
let in_flight = 0;
// how many requests have ANSWERED in this batch.
let done = 0;
// how many requests have been asked for in this batch.
let total = 0;
// the furthest the bar has ever reached in this batch. the bar is a
// high-water mark, so it only ever moves forward.
let high_water = 0;
// true once the fetch has been wrapped.
let patched = false;
// the fetch we replaced, kept so the wrapper can call the real one.
let real_fetch: typeof fetch | null = null;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// true while the page has asked for something and the answer has not
// all come back yet. it is what tells "idle" apart from "loading".
let active = false;
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
// how far along the bar is, from 0 to 1.
//
// --- WHY IT IS THE SHARE OF THE WORK THAT IS FINISHED: the bar fills
// as the answers land. counting the finished ones means it creeps
// forward as each answer comes in, instead of sitting at 100% for as
// long as the slowest request runs.
//
// --- WHY IT IS A HIGH-WATER MARK AND NOT A LIVE RATIO: a page's load
// is not one fixed batch. the account page asks four contracts in
// parallel, and THEN asks for the token metadata once all four have
// answered. a live "done / total" ratio hit 100% when the four sources
// landed and then dropped back to 80% when the metadata request joined
// the batch — a bar that went 0 → 100 → 80 → 100.
//
// the bar only ever moves forward during a run, so the reader sees one
// smooth sweep and never a bar that fights itself.
//
// --- WHY IT DOES NOT DROP TO ZERO WHEN THE PAGE GOES IDLE: the bar
// rests at the end after a load, the way a progress bar that has
// finished should look. snapping back to zero would make the bar
// flicker every time the page went quiet, and a reader would see the
// work undone. the next batch starts it over from zero on its own.
function get_progress_fun(): number {
  if (!active) return high_water > 0 ? 1 : 0;
  return high_water;
}
// ========================================
// work out the bar's new position and move it there.
//
// --- WHY THE SHARE IS SCALED TO 90%: while a request is still running
// the bar stops short of the end. the last tenth is only covered when
// the queue empties, so the reader always has a visible sign that
// something is still on its way.
function update_progress_fun(): void {
  if (total === 0) return;
  // everything is answered — the requests AND the icons. the work is
  // done and the bar may reach the end.
  if (in_flight === 0 && images_in_flight === 0) {
    high_water = 1;
    return;
  }
  // the share of the work that is finished, held short of the end.
  const share = (done / total) * 0.9;
  // the bar never goes backwards.
  if (share > high_water) high_water = share;
}
// ========================================
// --- BATCH -----------------------------
// a page's load is a batch of requests, and the bar runs once per
// batch.
//
// --- WHY A NEW BATCH IS NOT "THE QUEUE WAS EMPTY": the queue goes
// empty between two loads all the time — between the page's first
// load and the icons that follow it, for instance. treating every
// empty queue as a new batch made the bar restart from the left in the
// middle of one page load.
//
// --- WHY THE BATCH CLOSES ON A TIMER INSTEAD: the last request of a
// load and the first request of the next one are often only
// milliseconds apart, and nothing says which is which. waiting a short
// while after the page goes quiet tells them apart: a real new batch
// arrives after the gap, and a continuation arrives before it.
//
// --- WHY THE GAP IS 400MS: the icons of a page load arrive after the
// page's data has been rendered, which is a beat after the last
// request answered. a shorter gap closed the batch in between and the
// bar started over from the left as the icons came in — full, then
// empty, then full. 400ms is long enough to hold the whole of a page
// load together and short enough that a search feels instant.
const BATCH_GAP_MS = 400;
// the timer that closes the batch, if nothing else comes in.
let batch_timer: ReturnType<typeof setTimeout> | null = null;
// true once the batch has been closed by the gap timer. it is what
// separates "the page is still loading" from "a new action started".
let batch_closed = false;
// ========================================
// start a new batch: the counts go back to zero and the bar starts
// from the left.
function begin_batch_fun(): void {
  done = 0;
  total = 0;
  high_water = 0;
  active = true;
  batch_closed = false;
}
// ========================================
// close the batch once the page has gone quiet. the bar rests where it
// is — at the end — and the counts are forgotten, so the next batch
// starts over from the left.
function close_batch_fun(): void {
  active = false;
  batch_closed = true;
  done = 0;
  total = 0;
  // the high-water mark is NOT reset here. the bar rests at the end
  // after a load; only a new batch moves it back to the left.
  notify_fun();
}
// ========================================
// push the batch's closing timer back. the batch closes once the page
// has been quiet for a moment.
//
// --- WHY THE TIMER ONLY RUNS WHEN NOTHING IS IN FLIGHT: the timer is
// what tells a new batch apart from a continuation of the current one.
// a request that is still running means the page is NOT quiet, so the
// batch must not close under it — otherwise the counts are forgotten
// while work is still on its way and the bar loses track of it.
function push_batch_timer_fun(): void {
  if (batch_timer !== null) clearTimeout(batch_timer);
  batch_timer = setTimeout(() => {
    batch_timer = null;
    // still busy: the page has not gone quiet yet, so the batch stays
    // open and the timer is pushed back.
    if (in_flight > 0 || images_in_flight > 0) {
      push_batch_timer_fun();
      return;
    }
    close_batch_fun();
  }, BATCH_GAP_MS);
}
// ========================================
// a request came in. it either joins the current batch or starts a new
// one, and it pushes the batch's closing timer back.
//
// --- WHY THE BATCH IS OPENED BEFORE THE COUNTERS MOVE: a new batch
// resets the counts to zero. if the counter were moved first, the
// reset would wipe the count that was just added and the bar would
// never know the request existed.
//
// --- WHY A REQUEST JOINS THE CURRENT BATCH WHEN THE PAGE IS STILL
// BUSY: the icons arrive right after the page's data and the reader is
// waiting for both. if the icons started a new batch, the bar would go
// 100% → 0% → 100% as they came in.
//
// --- WHY A REQUEST STARTS A NEW BATCH ONLY AFTER THE GAP: the gap
// timer is what tells "still the same page load" apart from "a new
// action". a search, a sort or a LOAD MORE comes after the page has
// been quiet, and that is a new sweep of the bar.
function request_started_fun(): void {
  // the page is quiet and there is no work in flight: this is a new
  // batch and the bar starts over from the left.
  if (!active || (in_flight === 0 && images_in_flight === 0)) {
    // --- WHY THE GAP IS CHECKED: right after the page's last request
    // answered, the batch is still open but the queue is empty. a
    // request that lands in that moment is a CONTINUATION, not a new
    // batch, so the bar must not start over.
    if (batch_closed) {
      begin_batch_fun();
    }
  }
  push_batch_timer_fun();
}
// ========================================
// a request finished.
function request_finished_fun(): void {
  done += 1;
  update_progress_fun();
  // the batch's closing timer is pushed back, because the page just
  // did something — it is not quiet yet.
  push_batch_timer_fun();
  notify_fun();
}
// ========================================
// true while the page is loading: something was asked for and the
// answer has not all come back.
//
// --- WHY THIS IS NOT THE SAME AS "the bar is not full": the bar sits
// at 100% while the last request is still running, so the bar's own
// width cannot say whether the page is still busy. this can.
function is_loading_fun(): boolean {
  return active;
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
  // the batch is opened FIRST, so the count that follows belongs to
  // this batch and is not wiped by a new batch starting.
  request_started_fun();
  in_flight += 1;
  total += 1;
  update_progress_fun();
  notify_fun();
  try {
    // --- WHY the response is read here: the reader only counts the
    // request as done once the body is in, so the bar never says
    // "done" while the page is still waiting for the bytes.
    const response = await (real_fetch as typeof fetch)(input, init);
    return response;
  } finally {
    in_flight -= 1;
    request_finished_fun();
  }
}
// ========================================
// --- IMAGES ----------------------------
// count the token icons.
//
// --- WHY IMAGES ARE COUNTED: the icons are <img> tags pointing at the
// api's content-addressed icon urls. the browser loads them itself, so
// fetch never sees them. on a discover page that is up to three
// hundred images the reader waits for, and without counting them the
// bar sat at 100% while they were still arriving.
//
// --- WHY THE COUNT IS THE PAGE'S OWN CODE AND NOT A PATCH ON THE DOM:
// the browser's image loading cannot be observed from javascript
// without replacing the element, and replacing every <img> would break
// the lazy loading the long lists rely on. the icon urls are known to
// the app, so the app counts them.
//
// --- WHY AN IMAGE IS COUNTED AS PART OF THE PAGE'S WORK AND NOT AS A
// SEPARATE THING: an icon is something the reader waits for, so it
// belongs in the same bar. it is counted in the same totals as the
// fetches, which is what keeps the bar from reaching the end while the
// icons are still arriving.
let images_in_flight = 0;
// ========================================
// an icon started loading.
//
// --- WHY AN ICON JOINS THE PAGE'S BATCH INSTEAD OF STARTING A NEW ONE:
// the icons arrive right after the page's data, and the reader is
// waiting for both. if the icons started a new batch, the bar would go
// 100% → 0% → 100% — full, then empty, then full again — as the icons
// came in. the icons are part of the same page load, so they belong to
// the same sweep of the bar.
//
// the batch still opens if the page has been quiet for a moment, which
// is the case for an icon that loads much later on its own.
function image_started_fun(): void {
  request_started_fun();
  images_in_flight += 1;
  total += 1;
  update_progress_fun();
  notify_fun();
}
// ========================================
// an icon finished loading, one way or the other.
//
// --- WHY A BROKEN ICON STILL CLOSES THE COUNT: the icon url can be
// dead, and a dead icon must not hold the bar open forever. the
// reader sees a broken image and the bar still finishes.
function image_finished_fun(): void {
  images_in_flight -= 1;
  request_finished_fun();
}
// ========================================
// how many icons are in flight right now.
function get_images_in_flight_fun(): number {
  return images_in_flight;
}
// ========================================
// --- INSTALL ---------------------------
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
// --- INSTALL ON IMPORT ------------------
// the patch goes in as soon as this module is loaded, NOT when the
// component mounts.
//
// --- WHY: a page's html loads its start script BEFORE the shared
// import. the discover page's start script fires the page's requests
// the moment it runs, and the shared import — which is what brings
// the bar's component in — runs after it. so if the patch waited for
// the component's effect, the page's FIRST load would already be
// flying and would never be counted. the bar would sit dark through
// the whole first load and only come alive for the next one.
//
// installing here means the patch is in place before any page's
// script runs, so the first request is counted like every other.
install_fun();
// ========================================
// --- PUBLIC ---------------------------
export const HUGGIES_LOADING_BAR = {
  install: install_fun,
  subscribe: subscribe_fun,
  get_progress: get_progress_fun,
  get_in_flight: get_in_flight_fun,
  is_loading: is_loading_fun,
  image_started: image_started_fun,
  image_finished: image_finished_fun,
  get_images_in_flight: get_images_in_flight_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
