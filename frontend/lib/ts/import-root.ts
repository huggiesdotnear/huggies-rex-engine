// ========================================
// the splash page's ONE entry: the page's html loads this file and
// nothing else.
//
// the splash page is the app's front door — it shows one line of text
// and then redirects into the feed, so it carries neither the nav nor
// the auth button.
//
// the order below IS the page's order of life, and it matters:
//
// 1. hello pins the network to mainnet. the splash page is the first
//    page a reader lands on, so the pin has to be in place before
//    anything reads the network.
// 2. the start begins the splash page's redirect into the feed.
// 3. the components mount last.
//
// --- WHY --- the service worker is registered here too: the splash
// page is the first page a reader lands on, so it is the best place to
// put the worker in place.
import "./hello";
import "./root/root_page_start";
import "../components/app-wide/loading_bar";
import "../components/root/random_slogan_p";
// ========================================
// --- SERVICE WORKER --------------------
import { register_service_worker_fun } from "./shared/register_service_worker";
register_service_worker_fun();
// ========================================
// copyright 2026 by sleet.near
// ========================================
