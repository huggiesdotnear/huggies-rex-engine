// ========================================
// the feed page's ONE entry: the page's html loads this file and
// nothing else.
//
// the feed page is the app's front door — it carries the queue feed, the
// filter bar and the toast layer.
//
// the order below IS the page's order of life: the network pin and the
// app-wide components come first, the page's start fires its first
// request, and the page's own components mount last and read what the
// load brought back.
import "./import-app-wide";
import "./feed/app_page_feed_start";
import "../components/feed/app_page_feed_filters";
import "../components/feed/app_page_feed_status";
import "../components/feed/app_page_feed_post";
import "../components/shared/toast_layer";
// ========================================
// copyright 2026 by sleet.near
// ========================================
