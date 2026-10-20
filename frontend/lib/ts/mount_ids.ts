// ========================================
// HUGGIES_MOUNT_IDS
// every <div id="..."> a frontend component self-mounts into
// lives here. keeping them in one file means an HTML author
// can scan the keys, copy the matching id onto their page,
// and know exactly which id corresponds to which component
// (and vice versa).
//
// the id strings are kept as `as const` so the consumer side
// never accidentally trims / cases them wrong.
//
// naming: SCREAMING_SNAKE string ids that mirror the
// component filename in upper case (frontend/lib/components
// /nav.tsx → MOUNT_ID.HUGGIES_COMPONENT_NAV).
// when two components share a page, keep them in the same
// `MOUNT_ID` namespace — pages can mount as many cards as
// they want.
// ========================================
// HUGGIES_MOUNT_ID
export const HUGGIES_MOUNT_ID = {
  HUGGIES_COMPONENT_NAV: "HUGGIES_COMPONENT_NAV",
  HUGGIES_COMPONENT_RANDOM_SLOGAN_P: "HUGGIES_COMPONENT_RANDOM_SLOGAN_P",
  HUGGIES_COMPONENT_NETWORK_BUTTON: "HUGGIES_COMPONENT_NETWORK_BUTTON",
  HUGGIES_COMPONENT_AUTH_BUTTON: "HUGGIES_COMPONENT_AUTH_BUTTON",
} as const;
// ========================================
// HUGGIES_MOUNT_ID_TYPE
export type HUGGIES_MOUNT_ID_TYPE =
  (typeof HUGGIES_MOUNT_ID)[keyof typeof HUGGIES_MOUNT_ID];
// ========================================
