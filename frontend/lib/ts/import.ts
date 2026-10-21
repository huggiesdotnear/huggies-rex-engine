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
// pages wired:
//   /app/index.html            HUGGIES_COMPONENT_NAV
//   /app/swap.html             HUGGIES_COMPONENT_NAV
//   /app/account.html          HUGGIES_COMPONENT_NAV
//   /app/skill.html            HUGGIES_COMPONENT_NAV
//   /index.html                HUGGIES_COMPONENT_RANDOM_SLOGAN_P
//
// auth.html and account-router.html are intentionally not wired —
// auth.html is the login/redirect page (the nav would be
// confusing), and account-router.html is a pure redirect shim
// that never stays on screen long enough to host a nav.
//
// the nav lives on every other page, so its import is universal.
// the network button and auth button are wired alongside the nav for
// the same reason; the random slogan only lives on the root landing
// page. none of them care about which pages carry the id — the
// self-mount blocks only fire when a matching id is actually on the
// page.
//
// the auth button pulls in auth_status.ts, which builds a
// NearConnector and wires wallet events. that only happens inside its
// guarded mount block, so importing it on a page with no auth mount
// element stays inert.
// ========================================

import "../components/nav";
import "../components/random_slogan_p";
import "../components/network_button";
import "../components/auth_button";
// ========================================
