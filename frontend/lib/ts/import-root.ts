// ========================================
// the splash page's components: the loading bar and the random slogan.
//
// the splash page is the app's front door — it shows one line of text
// and then redirects into the feed, so it carries neither the nav nor
// the auth button.
//
// --- WHY --- THE NETWORK PIN IS HERE: the splash page is the first page
// a reader lands on, and the pin has to be in place before anything
// reads the network. the splash page does not load hello.ts as its own
// script, so it comes in here.
//
// --- WHY --- the service worker is registered here too: the splash
// page is the first page a reader lands on, so it is the best place to
// put the worker in place.
import "./hello";
import "../components/loading_bar";
import "../components/random_slogan_p";
// ========================================
// --- SERVICE WORKER --------------------
import { register_service_worker_fun } from "./shared/register_service_worker";
register_service_worker_fun();
// ========================================
// copyright 2026 by sleet.near
// ========================================
