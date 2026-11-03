// ========================================
// the toast store: the list of messages that appear over the swap page
// and then go away.
//
// a toast is the app's way of saying "that worked" or "that did not",
// without taking the reader away from what they were doing. the swap
// page is where the app's first transaction happens, so the reader
// needs to be told what came of it.
//
// --- WHY A STORE AND NOT A CALLBACK: the thing that CAUSES a toast
// (a swap that finished) is not the thing that DRAWS it (a component
// mounted somewhere on the page). a store lets the first tell the
// second, and lets several toasts queue up without any of them knowing
// about the others.
//
// --- WHY THE READER IS A COMPONENT AND NOT A PIECE OF PAGE MARKUP:
// a toast floats over the page, so it cannot live inside the page's
// column — it has to be a fixed layer of its own.
import { tx_detail_href_fun } from "../shared/tx_link";
// ========================================
// ========================================
// --- TYPES ------------------------------
// one toast.
export interface SHIT_1170_TOAST {
  // the toast's own id, so the same message twice is still two toasts.
  id: number;
  // what kind of toast this is: "success", "error" or "info".
  kind: "success" | "error" | "info";
  // the headline.
  title: string;
  // the line under it.
  detail: string | null;
  // the transaction to link to, when there is one.
  tx_hash: string | null;
}
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how long a toast stays on the screen.
//
// --- WHY --- long enough to read a link, short enough that a pile of
// them does not cover the page. a toast with a transaction link is
// worth clicking, so it gets a moment longer than one without.
const SHIT_1170_TOAST_MS = 6000;
const SHIT_1170_TOAST_WITH_LINK_MS = 9000;
// ========================================
// ========================================
// --- STATE ------------------------------
// the toasts on the screen, oldest first.
let toasts: SHIT_1170_TOAST[] = [];
// the counter behind the toast ids.
let next_id = 1;
// the plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing cannot break the
// notify.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[toast_store] listener failed", err);
    }
  }
}
// ========================================
// register a re-render callback; returns an unsubscribe to clean up on
// unmount.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// remove one toast.
function dismiss_fun(id: number): void {
  const before = toasts.length;
  toasts = toasts.filter((toast) => toast.id !== id);
  if (toasts.length !== before) notify_fun();
}
// ========================================
// ========================================
// --- SHOW ------------------------------
// show one toast and start its timer.
//
// --- WHY --- the timer is a plain setTimeout and not a component
// effect: the toast's life is decided by the thing that showed it, so
// the toast can be dismissed the same way whether the reader closed it
// or the timer ran out.
function show_fun(
  kind: SHIT_1170_TOAST["kind"],
  title: string,
  detail: string | null = null,
  tx_hash: string | null = null,
): number {
  const id = next_id;
  next_id += 1;
  toasts = [...toasts, { id, kind, title, detail, tx_hash }];
  notify_fun();
  const life =
    tx_hash === null ? SHIT_1170_TOAST_MS : SHIT_1170_TOAST_WITH_LINK_MS;
  setTimeout(() => dismiss_fun(id), life);
  return id;
}
// ========================================
// ========================================
// --- READ ------------------------------
function get_fun(): ReadonlyArray<SHIT_1170_TOAST> {
  return toasts;
}
// ========================================
// the link to the transaction page, for a toast that has a hash.
//
// --- WHY --- the depth is 0: the toast layer sits on the swap page,
// which is at the top of app/, so the transaction page is one level up
// from it and needs no "../" prefix.
function tx_link_fun(tx_hash: string): string {
  return tx_detail_href_fun(tx_hash, 0);
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_TOAST_STORE = {
  show: show_fun,
  dismiss: dismiss_fun,
  subscribe: subscribe_fun,
  get: get_fun,
  tx_link: tx_link_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
