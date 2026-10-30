// ========================================
// MIDDLEMAN
// one typed client per api huggies talks to. each sub folder owns a
// single backend and nothing else talks to it directly.
//
//   huggies/  - our own backend routes.
//
// the third-party apis are typed clients published on npm, so they are
// imported from their package and not copied in here:
//
//   @sleet-js/middleman-intear-api     the intear api at api.intea.rs
//   @sleet-js/middleman-intear-dex-api the intear dex backend
//   @sleet-js/middleman-rhea-api       the rhea indexer api
//
// frontend components import from here, never from an api sdk.
// ========================================

export * from "./huggies/index";
// ========================================
// copyright 2026 by sleet.near
