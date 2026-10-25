// ========================================
// MIDDLEMAN
// one typed client per api huggies talks to. each sub folder owns a
// single backend and nothing else talks to it directly:
//
//   intear/   - the intear api at api.intea.rs, called from the
//               browser so our backend is never rate limited by it.
//   huggies/  - our own backend routes under /api/huggies/.
//   near_kit_tool_box/ - a local stand-in for @near-kit-tool-box/fun,
//               holding the chain helpers the published package does
//               not ship yet.
//
// frontend components import from here, never from an api sdk or
// fetch() directly.
// ========================================

export * from "./intear/index";
export * from "./huggies/index";
export * from "./near_kit_tool_box/index";
// ========================================
// copyright 2026 by sleet.near
