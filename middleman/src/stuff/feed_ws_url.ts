// ========================================
// FEED_WS_URL
// turn a base url into the socket url of the same place.
//
// the frontend passes the origin of the page it is served from, and a
// bin passes whatever backend it was told to talk to. the feed socket
// lives on the same host, so the url is the base url with the scheme
// swapped for the socket one and the route appended.
//
// --- WHY --- THE SCHEME IS SWAPPED BY HAND and not with the URL
// api: `http` and `ws` are not interchangeable schemes, and a url api
// has no idea how to rewrite them.
//
// --- WHY --- THE ROUTE IS APPENDED TO EVERY FORM: the path is the
// route, and a socket url without it would connect to whatever answers
// at the root of the host.
//
// --- WHY --- A BASE URL THAT IS ALREADY A SOCKET URL IS LEFT ALONE: a
// caller that hands over ws:// or wss:// knows what it wants, and
// rewriting it would only break it. the path is still added, because
// the route is the route.
// ========================================

import { ENDPOINT_PATHS } from "./endpoint_paths";

// --- WHY --- THE TRAILING SLASH IS DROPPED: a base url of
// "http://host/" would otherwise give "http://host//api/...".
export function feed_ws_url_fun(base_url: string): string {
  const trimmed = base_url.trim();
  const without_tail = trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
  if (without_tail.startsWith("https://")) {
    return `wss://${without_tail.slice("https://".length)}${ENDPOINT_PATHS.api_shit_1170_feed_ws}`;
  }
  if (without_tail.startsWith("http://")) {
    return `ws://${without_tail.slice("http://".length)}${ENDPOINT_PATHS.api_shit_1170_feed_ws}`;
  }
  return `${without_tail}${ENDPOINT_PATHS.api_shit_1170_feed_ws}`;
}
// ========================================
// copyright 2026 by sleet.near
