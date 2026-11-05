// ========================================
// the feed's LIVE SOCKET: the new posts, as they are queued.
//
// the feed page used to show a feed that only moved when the reader
// pressed something or reloaded. the backend pushes every new queued
// batch and every new queued swap over one socket, and this module
// holds that socket and hands each event to the store.
//
// --- WHY THE SOCKET IS FILTER-AGNOSTIC: the backend does not know what
// the reader's filter is — the socket is OPEN and carries everything —
// so the client decides what matches. one socket for the page, and the
// match check reads the filter off the store at the moment the event
// arrives. a filter change therefore costs no socket churn at all.
//
// --- WHY THE HANDLE IS HELD HERE AND NOT IN THE STORE: the store owns
// the DATA, and this module owns the CONNECTION. the store asks for the
// live feed and this module gives it a handle it can close.
//
// --- WHY THE CLOSE WAITS FOR NOTHING: the middleman's own handle
// closes the socket and stops the reconnects. the route socket's
// close had to wait for the handshake because the browser logs a
// closed-before-open socket as an error, but the feed socket is opened
// by the middleman and the middleman closes it the same way it closes
// its own reconnects — there is no socket handed to us to wait on.
//
// --- WHY THE ERRORS ARE ONLY LOGGED: a socket that dies is a socket
// the middleman reconnects with a backoff. the reader does not need to
// be told about a dropped connection that is already being repaired, and
// an error line over the feed would be noise.
import {
  api_shit_1170_feed_ws,
  type SHIT_1170_FEED_WS_EVENT,
  type SHIT_1170_FEED_WS_HANDLE,
} from "@huggies/shit-1170-rex-engine-middleman";
import { SHIT_1170_BASE_URL } from "../shared/base_url";
// ========================================
// ========================================
// --- STATE ------------------------------
// the open socket, or null when there is none.
//
// --- WHY --- IT IS HELD AND NOT JUST OPENED: a handle nobody keeps is
// a handle that cannot be closed, and the page has to be able to let go
// of the socket when it goes away.
let handle: SHIT_1170_FEED_WS_HANDLE | null = null;
// ========================================
// ========================================
// --- OPEN ------------------------------
// open the live feed, and hand every event to the callback.
//
// --- WHY --- OPENING TWICE IS A NO-OP: the page's load can run more
// than once — the auth watch reloads it — and a second socket would
// push every event twice and every post would arrive twice.
//
// --- WHY --- THE CALLBACK IS THE ONLY THING THE CALLER GIVES: the
// socket's whole job is to say "this happened". what to DO about it is
// the store's business.
//
// --- WHY --- THE CONNECT IS LOGGED: a feed that is quiet and a feed
// that is not connected look the same from the page — nothing arrives
// in both cases. the log says which one it is, and it says how many
// tries the socket has made, so a flapping connection is visible.
export function shit_1170_feed_ws_open_fun(
  on_event: (event: SHIT_1170_FEED_WS_EVENT) => void,
): void {
  if (handle !== null) return;
  handle = api_shit_1170_feed_ws(
    SHIT_1170_BASE_URL,
    on_event,
    (message) => {
      console.warn("[app_page_feed_ws] the live feed reported", message);
    },
    (info) => {
      console.info(
        `[app_page_feed_ws] the live feed connected: ${info.url} ` +
          `(attempt ${info.attempt}, waited ${info.waited_ms}ms)`,
      );
    },
  );
}
// ========================================
// ========================================
// --- CLOSE -----------------------------
// close the live feed and stop the reconnects.
//
// --- WHY --- CLOSING A CLOSED FEED IS A NO-OP: the page may go away
// without the feed ever having opened, and a close on a feed that was
// never opened must not throw.
export function shit_1170_feed_ws_close_fun(): void {
  if (handle === null) return;
  const open_handle = handle;
  handle = null;
  try {
    open_handle.close();
  } catch (err) {
    console.warn("[app_page_feed_ws] the live feed could not be closed", err);
  }
}
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_APP_PAGE_FEED_WS = {
  open: shit_1170_feed_ws_open_fun,
  close: shit_1170_feed_ws_close_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
