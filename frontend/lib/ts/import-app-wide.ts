// ========================================
// the components EVERY page carries: the loading bar, the nav and the
// auth button.
//
// --- WHY --- a page's own import file lists the components that page
// mounts, and these three are on every page's html — so they are
// listed here once and every page's import file pulls this in.
//
// --- WHY --- THE NETWORK PIN IS HERE: hello.ts pins the network to
// mainnet, and the pin has to land before the first
// near_connect_client() call. every page's import file pulls this in
// FIRST, so the pin is in place before the page's own start or route
// script runs — those touch the wallet.
//
// see frontend/lib/ts/hello.ts.
import "./hello";
import "../components/loading_bar";
import "../components/nav";
import "../components/auth_button";

// ========================================
// --- SERVICE WORKER --------------------
// the service worker is registered on every page, so it lives here with
// the app-wide three.
//
// --- WHY --- it is registered from here and not from a page's own
// import file: a worker only offers the "install app" prompt once it
// is registered, and the prompt can appear on any page the reader is
// on when they accept it.
import { register_service_worker_fun } from "./shared/register_service_worker";
register_service_worker_fun();
// ========================================
// copyright 2026 by sleet.near
// ========================================
