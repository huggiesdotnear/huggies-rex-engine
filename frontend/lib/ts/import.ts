// ========================================
// IMPORTS
// the single place every frontend page's component imports live.
// pages opt into a component by adding a mount element (e.g.
// <nav id="HUGGIES_COMPONENT_NAV">) in their html AND adding a
// matching side-effect import here. the component file's self-mount
// block runs on import, so this file is what wires a component into
// a page.
//
// keeping imports here (instead of letting each page script import
// directly) means:
//   - one file to scan when you want to know what's wired up
//   - one place to add a new component import
//   - hello.ts stays a tiny entry that just runs the banner
//
// every app/* page loads this file as its main script tag, even
// the redirect-only ones (auth.html and account-router.html).
// the redirect side-effects run from here too, so the
// page-loading convention stays uniform — "every app/* page
// loads import.ts" is the rule, with no exceptions to remember.
// the extra module loads a redirect page picks up (e.g. account-
// router.html pulling in components it does not mount) only run
// import-time side effects; the mount guards skip, so the cost is
// a few no-op module loads in exchange for a single convention
// to teach.
//
// pages served:
//   /index.html              splash (handled by index.ts, which
//                            redirects to /app/index.html); this
//                            file is not loaded here
//   /app/index.html          HUGGIES_COMPONENT_NAV
//   /app/swap.html           HUGGIES_COMPONENT_NAV
//   /app/account.html        HUGGIES_COMPONENT_NAV
//   /app/skill.html          HUGGIES_COMPONENT_NAV
//   /app/auth.html           auth_redirect (subscribes to
//                            HUGGIES_AUTH + bounces to account
//                            on sign-in) plus the network/auth
//                            buttons the page declares
//   /app/account-router.html account_router (one-shot redirect to
//                            auth or account); page declares no
//                            mount elements so the component side
//                            effects below are no-ops here
//
// the nav lives on every other page, so its import is universal.
// the network button and auth button are wired alongside the nav
// for the same reason. none of them care about which pages carry
// the id — the self-mount blocks only fire when a matching id is
// actually on the page.
//
// the auth button pulls in auth_status.ts, which builds a
// NearConnector and wires wallet events. that only happens inside
// its guarded mount block, so importing it on a page with no auth
// mount element stays inert.
// ========================================

import "../components/nav";
import "../components/random_slogan_p";
import "../components/network_button";
import "../components/auth_button";
// redirect side-effect imports. these do not mount components;
// they kick a redirect on page load and (for auth_redirect)
// subscribe to auth state while the page is on screen. see the
// named modules for the per-page redirect rules.
import "./auth_redirect";
import "./account_router";
// ========================================
