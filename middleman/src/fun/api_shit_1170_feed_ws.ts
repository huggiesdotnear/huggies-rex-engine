// ========================================
// API_SHIT_1170_FEED_WS
// GET /api/shit-1170/feed/ws — the LIVE feed, as a websocket.
//
// the socket is a WEBSOCKET UPGRADE. the client opens it and the server
// pushes one json text message per event:
//
//   { "type": "queue", "queue": { ...TX_QUEUE_ITEM... } }
//   { "type": "swap",  "swap":  { ...SWAP_QUEUE_ITEM... } }
//
// the server sends NOTHING ELSE. the ping it sends every thirty seconds
// is a CONTROL frame, and a client's message handler never sees it.
//
// --- WHY --- THIS DOES NOT GO THROUGH api_call: api_call does one
// request and one response, and a socket is neither. the socket opens
// once and then the events arrive for as long as the connection lives,
// so there is no response to await and no error envelope to read.
//
// --- WHY --- THE SOCKET IS OPEN AND NEEDS NO API KEY: the queue list
// it replaces is open, and the socket carries the same items in the
// same shape. a socket that asked for a key would be a socket the feed
// page could not open before it had signed in.
//
// --- WHY --- THE HANDLE, AND NOT A PROMISE: a promise answers "is the
// socket open", and the interesting question is "what happens to this
// connection", which is the handle's job. the handle closes the socket
// and stops the reconnects.
//
// --- WHY --- THE RECONNECT IS HERE AND NOT IN THE CALLER: a feed page
// that loses the socket and does not reconnect is a feed page that
// silently goes stale. a socket dies on a phone all the time — a
// tunnel, a sleep, a network change — and the reader must not have to
// know that. the caller still gets the handle, so it can stop the
// reconnects the moment it does not want the feed any more.
//
// --- WHY --- THE BACKOFF STARTS AT ONE SECOND AND DOUBLES TO FIFTEEN:
// a server that is restarting comes back in seconds, and a server that
// is down must not be hammered. the cap keeps the wait honest.
//
// --- WHY --- THE BACKOFF IS RESET ON A SUCCESSFUL OPEN: a connection
// that lived is a healthy connection, and the next failure starts
// small again. without the reset a long healthy run would leave the
// next failure waiting fifteen seconds for no reason.
//
// --- WHY --- CLOSE STOPS THE RECONNECT: the close is the caller's
// word that the feed is not wanted. a handle that reconnected after a
// close would open a socket nobody is reading, and the page could
// never let go of it.
//
// --- WHY --- THE URL IS BUILT FROM THE BASE URL and not asked for:
// the base url is the thing every other call takes, and the frontend
// passes the origin of the page. the scheme is swapped for the socket
// one — http becomes ws, https becomes wss — and a base url that is
// already a socket url is left alone.
// ========================================

import { feed_ws_url_fun } from "../stuff/feed_ws_url";
import { parse_feed_ws_event } from "../stuff/parse_feed_ws_event";
import type { SHIT_1170_FEED_WS_EVENT } from "../types/shit_1170_feed_ws";

// --- CONFIG -----------------------------
// how long to wait before the first reconnect.
const FEED_WS_BACKOFF_START_MS = 1_000;
// the longest the wait ever gets.
const FEED_WS_BACKOFF_MAX_MS = 15_000;
// ========================================
// what the caller gets back.
//
// --- WHY --- close is the ONLY thing on it: it is the one thing a
// caller needs, and every extra field on the handle is a thing that
// can be used wrongly.
export interface SHIT_1170_FEED_WS_HANDLE {
  // close the socket and stop the reconnects. calling it twice is
  // harmless.
  close: () => void;
}

// open the live feed.
//
// --- WHY --- THE CALLBACKS ARE PLAIN FUNCTIONS and not an object of
// handlers: the caller wants to hand over two things — what to do with
// an event, and what to do with a failure — and the rest of the socket
// is the middleman's business.
export function api_shit_1170_feed_ws(
  base_url: string,
  on_event: (event: SHIT_1170_FEED_WS_EVENT) => void,
  on_error?: (message: string) => void,
): SHIT_1170_FEED_WS_HANDLE {
  const url = feed_ws_url_fun(base_url);

  // --- THE STATE ------------------
  // wanted: the caller still wants the feed. it is the one switch that
  // decides whether the socket may be opened at all.
  let wanted = true;
  // the socket of the moment. it is replaced on every connect.
  let socket: WebSocket | null = null;
  // the timer of the pending reconnect.
  let retry_timer: ReturnType<typeof setTimeout> | null = null;
  // how long the next wait is.
  let backoff_ms = FEED_WS_BACKOFF_START_MS;

  // say what went wrong, to whoever asked to hear it.
  function report_fun(message: string): void {
    if (!on_error) return;
    on_error(message);
  }

  // --- WHY --- THE EVENT IS HANDLED IN A TRY: the caller's callback is
  // its own code, and a throw in it must not kill the socket. the
  // connection is worth more than one callback.
  function handle_event_fun(event: SHIT_1170_FEED_WS_EVENT): void {
    try {
      on_event(event);
    } catch (err) {
      report_fun(
        `api_shit_1170_feed_ws failed: the event callback threw: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // --- THE SOCKET ------------------
  function open_fun(): void {
    if (!wanted) return;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      report_fun(
        `api_shit_1170_feed_ws failed: the socket would not open: ${err instanceof Error ? err.message : String(err)}`,
      );
      schedule_retry_fun();
      return;
    }
    socket = ws;

    ws.onopen = () => {
      // --- WHY --- THE BACKOFF IS RESET HERE: a connection that opened
      // is a healthy connection, and the next failure starts small
      // again.
      backoff_ms = FEED_WS_BACKOFF_START_MS;
    };

    ws.onmessage = (message: MessageEvent) => {
      // --- WHY --- ONLY TEXT IS READ: the server sends one json text
      // message per event. a binary frame is not a thing our server
      // sends, so it is not read.
      if (typeof message.data !== "string") return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(message.data) as unknown;
      } catch {
        report_fun("api_shit_1170_feed_ws failed: the message was not json");
        return;
      }

      const event = parse_feed_ws_event(parsed);
      // --- WHY --- A MESSAGE WE DO NOT KNOW IS SKIPPED and not fatal:
      // one bad message must not take the connection down.
      if (!event) return;
      handle_event_fun(event);
    };

    ws.onerror = () => {
      // --- WHY --- THE ERROR HANDLER SAYS NOTHING OF ITS OWN: the
      // close handler is what follows an error, and it says what
      // happened. two messages for one failure is noise.
    };

    ws.onclose = (event: CloseEvent) => {
      socket = null;
      // --- WHY --- A CLOSE AFTER close() IS NOT A FAILURE: the caller
      // asked for it, so there is nothing to report and nothing to
      // reconnect to.
      if (!wanted) return;
      // --- WHY --- THE CODE AND THE REASON GO IN THE MESSAGE: a close
      // with no reason is the one thing a reader cannot act on. the
      // code is the websocket's own number — 1000 is a normal close,
      // 1006 is "the connection never came up".
      const reason = event?.reason ? `: ${event.reason}` : "";
      report_fun(
        `api_shit_1170_feed_ws failed: the socket closed (${event?.code ?? "unknown"})${reason}`,
      );
      schedule_retry_fun();
    };
  }

  // wait, then try again.
  function schedule_retry_fun(): void {
    if (!wanted) return;
    if (retry_timer !== null) return;

    const wait = backoff_ms;
    // --- WHY --- THE WAIT DOUBLES ON THE WAY OUT: every failure costs
    // more than the one before it, up to the cap.
    backoff_ms = Math.min(wait * 2, FEED_WS_BACKOFF_MAX_MS);

    retry_timer = setTimeout(() => {
      retry_timer = null;
      open_fun();
    }, wait);
  }

  // --- THE HANDLE -----------------
  const handle: SHIT_1170_FEED_WS_HANDLE = {
    close: () => {
      // --- WHY --- THE WANTED FLAG GOES FIRST: it is what stops the
      // reconnects, and the close of the socket below fires the close
      // handler, which must see it.
      wanted = false;
      if (retry_timer !== null) {
        clearTimeout(retry_timer);
        retry_timer = null;
      }
      if (socket) {
        try {
          socket.close();
        } catch {
          // --- WHY --- A CLOSE THAT THROWS IS IGNORED: the socket is
          // going away either way, and the caller asked for it.
        }
        socket = null;
      }
    },
  };

  // --- WHY --- THE FIRST CONNECT IS RIGHT HERE and not left to the
  // caller: the caller asked for the live feed, so the feed starts now.
  // the handle is built first, so a socket that fails to open at once
  // can already be closed by the caller.
  open_fun();

  return handle;
}
// ========================================
// copyright 2026 by sleet.near
