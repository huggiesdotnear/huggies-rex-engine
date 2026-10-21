// ========================================
// IMPORTS
// components only. this is the single TS file in the project that
// imports anything from frontend/lib/components/*; per AGENTS.md,
// no other TS file should pull components in (a redirect module
// like auth_redirect.ts or account_router.ts is free to import
// from frontend/lib/ts/* but never from frontend/lib/components/*).
//
// pages opt into a component by adding a mount element (e.g.
// <nav id="HUGGIES_COMPONENT_NAV">) in their html AND having this
// file loaded as one of their <script src="..."> tags. the
// component's self-mount block runs on import, so this file is what
// wires a component into a page.
//
// keeping imports here (instead of letting each page script import
// directly) means:
//   - one file to scan when you want to know what's wired up
//   - one place to add a new component import
//   - redirect modules stay focused on redirect logic and never
//     sneak in a `import "../components/..."` to pull a button in
//
// pages that load this file:
//   /app/index.html            HUGGIES_COMPONENT_NAV
//   /app/swap.html             HUGGIES_COMPONENT_NAV
//   /app/account.html          HUGGIES_COMPONENT_NAV
//   /app/skill.html            HUGGIES_COMPONENT_NAV
//   /app/auth.html             HUGGIES_COMPONENT_NETWORK_BUTTON +
//                              HUGGIES_COMPONENT_AUTH_BUTTON (the
//                              two mount elements the page
//                              declares)
//   /app/account-router.html   page has no mount elements, so all
//                              four side-effect imports below
//                              run their mount guards and skip.
//                              this file is loaded for symmetry
//                              with auth.html: both redirect pages
//                              share the same "import.ts brings
//                              components, account_router.ts /
//                              auth_redirect.ts brings the
//                              redirect" pattern.
//
// the nav lives on every mount-having page, so its import is
// universal. the network button and auth button are wired
// alongside the nav for the same reason; the random slogan only
// lives on the root landing page. none of them care about which
// pages carry the id — the self-mount blocks only fire when a
// matching id is actually on the page.
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
