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
// cache, the holder pager. patching the one global fetch catches every
// one of them, including the ones that run after the page's first
// paint (a search, a LOAD MORE, a sort change).
//
// --- WHY IMAGES ARE NOT COUNTED: the token icons are <img> tags and
// the browser loads them itself, so fetch never sees them. they are
// decoration though — the rows are readable without them, and a
// discover page asks for up to three hundred of them against ONE api
// call for the data itself. counting them would make the bar measure
// the pictures instead of the page's work, and a lazy icon would keep
// the bar alive for as long as the reader scrolled.
//
// the bar tracks the DATA. that is the work the reader is waiting for.
//
// the module is plain ts and holds no dom: the component in
// lib/components/loading_bar.tsx reads it and paints the bar.
//
// ========================================
// ========================================
// --- STATE ------------------------------
// the bar's state. it is one of three things and the component needs
// all three to draw itself.
//
// - IDLE: nothing is loading. the bar is hidden.
// - LOADING: work is on its way. the bar shows the progress.
// - DONE: the work just finished. the bar shows a full sweep once
//   and then fades out.
//
// --- WHY DONE IS ITS OWN STATE: a bar that rests at 100% forever
// reads as "still loading" to anyone glancing at it, and it covers
// the top of the page permanently. a bar that snaps back to empty
// instantly looks like it flickered. DONE is the small gap between
// the two: the sweep is visible for a moment, then the bar goes away.
export type HUGGIES_LOADING_BAR_STATE = "idle" | "loading" | "done";
// the bar's state right now.
let state: HUGGIES_LOADING_BAR_STATE = "idle";
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
// --- WHY IT IS A TARGET AND NOT A VALUE: the bar's position is where
// it is GOING, not where the work has got to. a page that asks four
// things in parallel has no way of knowing how long each will take,
// so a bar that only moves when an answer lands sits at zero for the
// whole of the slowest request and then jumps to the end. the reader
// sees nothing happen.
//
// so the bar has a TARGET — the share of the work that is finished —
// and it CREEPS toward that target while it waits. when an answer
// lands the target moves forward and the bar follows. the bar is
// always behind its target and never reaches it, so there is always a
// visible sign that something is still on its way.
//
// --- WHY THE CREEPS RUN ON A TIMER: the bar has to move while
// nothing is happening, which means something has to wake it up. a
// timer is the only thing that can do that.
function get_progress_fun(): number {
  return high_water;
}
// ========================================
// where the bar is GOING: the share of the work that is finished,
// held short of the end so there is always a sliver left for whatever
// is still running.
//
// --- WHY THE TARGET COUNTS THE WORK IN FLIGHT AS ALMOST DONE: the
// bar cannot know how long a request will take. if the target were
// only the finished share, it would sit at zero until the first answer
// landed and the bar would not move for the whole of the wait. the
// work in flight counts as almost done, so the target is always
// somewhere ahead of the bar and the bar always has somewhere to
// creep to.
function get_target_fun(): number {
  if (total === 0) return 0;
  if (in_flight === 0) return 1;
  // the finished share, plus most of the share that is still running.
  const finished = done / total;
  const running = (in_flight / total) * 0.9;
  return Math.min(finished + running, 0.95);
}
// ========================================
// move the bar a little closer to its target.
//
// --- WHY IT MOVES BY A SHARE OF THE REMAINING DISTANCE AND NOT BY A
// FIXED STEP: a fixed step reaches the end in the same number of ticks
// whether the bar has ten percent to cover or ninety. a share of what
// is left means the bar slows down as it approaches, so it eases into
// its target instead of slamming into it.
const CATCH_UP_RATE = 0.12;
// ========================================
// the timer that creeps the bar toward its target.
let creep_timer: ReturnType<typeof setInterval> | null = null;
// ========================================
// one tick of the creep.
//
// --- WHY THE BAR CREEPS EVEN WHEN NOTHING HAS ANSWERED YET: a page
// asks for four things in parallel and the bar cannot know how long
// any of them will take. if the bar only moved when an answer landed,
// it would sit at zero for the whole of the slowest request — which is
// most of the wait — and then jump to the end. the reader would see
// nothing happen.
//
// so the bar creeps toward its target on its own timer. the target is
// the share of the work that is finished, and the bar always stays a
// little behind it, so the reader sees the bar move the whole time
// and the movement slows down as the work finishes.
function creep_fun(): void {
  const target = get_target_fun();
  if (target <= high_water) return;
  // the bar moves a share of the way to its target.
  const step = (target - high_water) * CATCH_UP_RATE;
  high_water += step;
  notify_fun();
}
// ========================================
// start the creep, if it is not already running.
function start_creep_fun(): void {
  if (creep_timer !== null) return;
  creep_timer = setInterval(creep_fun, CREEP_INTERVAL_MS);
}
// ========================================
// stop the creep. the bar has nothing left to do.
function stop_creep_fun(): void {
  if (creep_timer === null) return;
  clearInterval(creep_timer);
  creep_timer = null;
}
// ========================================
// how often the bar creeps toward its target.
const CREEP_INTERVAL_MS = 60;
// ========================================
// work out the bar's new position and move it there.
//
// --- WHY THE TARGET MOVES AND NOT THE BAR: the bar is a high-water
// mark, so it only ever moves forward. the target is the share of the
// work that is finished, and the bar creeps toward it on its timer.
//
// --- WHY THE BAR DOES NOT JUMP TO THE TARGET: the target is where the
// bar is GOING. if the bar jumped to it every time an answer landed,
// it would move in steps — 0, 45, 90, 100 — and the creep would have
// nothing to do. the bar creeps toward the target instead, so the
// motion is smooth and the reader sees it move.
//
// --- WHY THE BAR JUMPS TO THE END WHEN THE WORK IS DONE: the last
// answer is the last thing the reader is waiting for, so the bar
// covers the final stretch at once rather than crawling the last tenth
// over another half second.
function update_progress_fun(): void {
  if (total === 0) return;
  // the work is done: the bar covers the last stretch at once.
  if (in_flight === 0) {
    high_water = 1;
    stop_creep_fun();
    return;
  }
  // there is more to come: the bar creeps toward the target.
  start_creep_fun();
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
// how long the finished sweep stays on screen before the bar goes
// away. it is long enough to be seen and short enough that it is not
// in the reader's way.
const DONE_HOLD_MS = 500;
// the timer that closes the batch, if nothing else comes in.
let batch_timer: ReturnType<typeof setTimeout> | null = null;
// the timer that takes the finished bar off the screen.
let done_timer: ReturnType<typeof setTimeout> | null = null;
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
  batch_closed = false;
  state = "loading";
  // the finished bar's timer is dropped, because a new load makes the
  // bar live again.
  if (done_timer !== null) {
    clearTimeout(done_timer);
    done_timer = null;
  }
  start_creep_fun();
}
// ========================================
// close the batch once the page has gone quiet. the bar shows the end
// of its sweep for a moment and then goes away.
function close_batch_fun(): void {
  batch_closed = true;
  done = 0;
  total = 0;
  // the creep stops: there is no target left to creep toward.
  stop_creep_fun();
  // the high-water mark is NOT reset here. the bar rests at the end
  // after a load; only a new batch moves it back to the left.
  if (state !== "loading") return;
  state = "done";
  if (done_timer !== null) clearTimeout(done_timer);
  done_timer = setTimeout(() => {
    done_timer = null;
    // --- WHY THE BAR ONLY GOES AWAY IF NOTHING NEW CAME IN: a request
    // that arrived while the sweep was on screen started a new batch,
    // and that batch owns the bar now.
    if (state === "done") state = "idle";
    notify_fun();
  }, DONE_HOLD_MS);
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
    if (in_flight > 0) {
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
  if (state === "idle" || state === "done") {
    begin_batch_fun();
  } else if (in_flight === 0) {
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
  return state === "loading";
}
// ========================================
// the bar's state, so the component knows whether to show it at all.
function get_state_fun(): HUGGIES_LOADING_BAR_STATE {
  return state;
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
// the signal's whole surface. it is small on purpose: the bar needs
// the state and the progress, and that is all.
//
// --- WHY get_in_flight IS HERE: it is what tells "the page is busy"
// apart from "the page is waiting on one slow request", and it is the
// number a caller would want if it ever needed to explain the bar.
//
// --- WHY install IS HERE: the module installs itself when it is
// imported, so the call is a no-op. it is on the surface because every
// page's start script calls it to make the ORDERING explicit — the
// patch is in place before the page's load, not merely by the time the
// component mounts.
export const HUGGIES_LOADING_BAR = {
  install: install_fun,
  subscribe: subscribe_fun,
  get_state: get_state_fun,
  get_progress: get_progress_fun,
  get_in_flight: get_in_flight_fun,
  is_loading: is_loading_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
