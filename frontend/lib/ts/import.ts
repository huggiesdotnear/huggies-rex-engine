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
//   /app/index.html       HUGGIES_COMPONENT_NAV
//   /app/swap.html        HUGGIES_COMPONENT_NAV
//   /app/account.html     HUGGIES_COMPONENT_NAV
//   /app/skill.html       HUGGIES_COMPONENT_NAV
//
// auth.html is intentionally not wired — it is the login/redirect
// page, so the nav would be confusing.
//
// the nav lives on every other page, so its import is universal.
// ========================================

import "../components/nav";
// ========================================
