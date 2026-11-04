// ========================================
// the queue page's summary card: the WHAT, the WHEN, the WHY and when
// the batch was queued.
//
// --- WHY THE WHAT IS THE HEADLINE: it is the agent's own sentence
// about the batch, and it is the one thing about a batch that needs no
// explaining.
//
// --- WHY THE WHEN AND THE WHY ARE THEIR OWN ROWS: they are the two
// things the reader asks after the what — when it should happen and
// why they want it.
//
// --- WHY THE TIMES ARE SHOWN BOTH WAYS: the ago is what a reader
// reads, and the exact time is what they check.
//
// mounts into <div id="SHIT_1170_COMPONENT_QUEUE_SUMMARY">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "../../ts/queue/app_page_queue_store";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// how long ago a moment was, in the app's own words.
//
// --- WHY --- the AGO is COMPUTED HERE and not taken from a library: it
// is one line, and the app already writes times this way.
function time_ago_fun(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "JUST NOW";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} MIN AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} H AGO`;
  const days = Math.floor(hours / 24);
  if (days < 365) return `${days} D AGO`;
  return `${Math.floor(days / 365)} Y AGO`;
}

// the exact time, in UTC.
//
// --- WHY --- UTC: the chain's time is one time, and saying it in UTC
// says the same thing to everyone.
function exact_time_fun(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

// ========================================
// --- ROW -------------------------------
// one labelled row of the card.
function row_fun(label: string, value: preact.JSX.Element): preact.JSX.Element {
  return (
    <div class="queue-summary-row">
      <span class="queue-summary-label">{label}</span>
      <span class="queue-summary-value">{value}</span>
    </div>
  );
}

// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_QUEUE_SUMMARY_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_QUEUE_STORE);
  const queue = state.queue;
  if (queue === null) return null;
  return (
    <section class="queue-summary">
      <h2 class="queue-summary-what">
        {queue.what !== null && queue.what.trim().length > 0
          ? queue.what.trim()
          : "A QUEUED BATCH"}
      </h2>
      <div class="queue-summary-card">
        {queue.when !== null &&
          queue.when.trim().length > 0 &&
          row_fun("WHEN", <span>{queue.when.trim()}</span>)}
        {queue.why !== null &&
          queue.why.trim().length > 0 &&
          row_fun("WHY", <span>{queue.why.trim()}</span>)}
        {queue.whenAt !== null &&
          row_fun(
            "WHEN AT",
            <span>
              {exact_time_fun(queue.whenAt)}
              <span class="queue-summary-sub">
                {time_ago_fun(queue.whenAt)}
              </span>
            </span>,
          )}
        {row_fun(
          "QUEUED",
          <span>
            {exact_time_fun(queue.createdAt)}
            <span class="queue-summary-sub">
              {time_ago_fun(queue.createdAt)}
            </span>
          </span>,
        )}
        {row_fun("CALLS", <span>{String(queue.transactions.length)}</span>)}
        {row_fun("ACCOUNTS", <span>{String(queue.accounts.length)}</span>)}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_QUEUE_SUMMARY;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_QUEUE_SUMMARY_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
