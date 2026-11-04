// ========================================
// the queue page's SEND: sign the batch and report it.
//
// --- WHY IT IS A THIN WRAPPER OVER THE FEED'S SEND: the wallet call,
// the outcomes and the report to the backend are the same on both
// pages — the batch is one offer of work and it is signed the same way
// wherever the reader found it. so the one implementation lives with
// the feed's actions and this calls it.
//
// --- WHY THE PAGE'S OWN ACTIONS EXIST: the ADD and REMOVE are the
// feed's, and they are the same on both pages for the same reason.
import {
  shit_1170_feed_add_fun,
  shit_1170_feed_remove_fun,
  shit_1170_feed_send_fun,
} from "../feed/app_page_feed_actions";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "./app_page_queue_store";
import type { SHIT_1170_QUEUE_SEND_RESULT } from "../feed/app_page_feed_send";
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- SEND ------------------------------
// send the batch from the reader's account.
//
// --- WHY THE QUEUE PAGE RELOADS AFTERWARDS: the batch's account rows
// carry the reader's new status and hash, and the page shows them.
export async function shit_1170_queue_send_fun(
  queue: SHIT_1170_TX_QUEUE,
): Promise<SHIT_1170_QUEUE_SEND_RESULT | null> {
  const result = await shit_1170_feed_send_fun(queue);
  await SHIT_1170_APP_PAGE_QUEUE_STORE.refresh();
  return result;
}
// ========================================
// --- ADD -------------------------------
// add the reader's account to the batch.
export async function shit_1170_queue_add_fun(
  queue: SHIT_1170_TX_QUEUE,
): Promise<boolean> {
  const done = await shit_1170_feed_add_fun(queue);
  await SHIT_1170_APP_PAGE_QUEUE_STORE.refresh();
  return done;
}
// ========================================
// --- REMOVE ----------------------------
// take the reader's account off the batch.
export async function shit_1170_queue_remove_fun(
  queue: SHIT_1170_TX_QUEUE,
): Promise<boolean> {
  const done = await shit_1170_feed_remove_fun(queue);
  await SHIT_1170_APP_PAGE_QUEUE_STORE.refresh();
  return done;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
