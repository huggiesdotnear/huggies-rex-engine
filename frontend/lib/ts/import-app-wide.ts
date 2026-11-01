// ========================================
// the components EVERY page carries: the loading bar, the nav and the
// auth button.
//
// --- WHY --- a page's own import file lists the components that page
// mounts, and these three are on every page's html — so they are
// listed here once and every page's import file pulls this in.
//
// --- WHY --- THE NETWORK PIN IS HERE AND ALSO ON THE PAGES THAT NEED
// IT EARLIER: hello.ts pins the network to mainnet, and the pin has to
// land before the first near_connect_client() call. the account page's
// routing script calls the wallet, and it runs BEFORE this file — so
// the pages that touch the wallet on load load hello.ts as their own
// first script. this import is here for the pages that do not: the ones
// under app/contract/ and app/token/, and the splash page.
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
