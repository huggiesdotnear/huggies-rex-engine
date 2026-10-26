// ========================================
// the tokens we mark on the discover list.
// ========================================
// the tokens we want a reader to recognise when they appear. this is a
// deliberate product list — NOT the old behaviour where every token
// the emojifi project happened to list was pinned. that list included
// test tokens, and pinning them meant the list never actually
// followed the chosen sort.
//
// these tokens are MARKED, not pinned: they are styled so they stand
// out wherever the sort puts them, but they never override the order.
// a reader who picks a sort wants that sort.
//
// each entry keeps a reason, so the list stays a decision instead of
// becoming a pile of ids nobody can explain later.
// ========================================

// ========================================
// --- SHAPE ------------------------------
// one marked token. `weight` orders the marked block among itself,
// lowest first — so our own token reads as the lead one.
export interface HUGGIES_PINNED_TOKEN {
  id: string;
  reason: string;
  weight: number;
}
// ========================================
// --- LIST -------------------------------
// the marked tokens, in the order they should appear among themselves.
export const HUGGIES_PINNED_TOKENS: ReadonlyArray<HUGGIES_PINNED_TOKEN> = [
  {
    id: "shit-1170.meme-cooking.near",
    reason: "our own token",
    weight: 0,
  },
  {
    id: "duct-1078.meme-cooking.near",
    reason: "meme-cooking token",
    weight: 10,
  },
  {
    id: "vote-1737.meme-cooking.near",
    reason: "meme-cooking token",
    weight: 10,
  },
  {
    id: "nearvember-337.meme-cooking.near",
    reason: "meme-cooking token",
    weight: 10,
  },
  {
    id: "poppy-0.meme-cooking-test.near",
    reason: "meme-cooking token",
    weight: 10,
  },
  {
    id: "token.0xshitzu.near",
    reason: "meme token",
    weight: 20,
  },
];
// ========================================
// --- GET -------------------------------
// the marked token ids, as a set for a fast lookup while rendering.
export function pinned_token_ids_fun(): Set<string> {
  return new Set(HUGGIES_PINNED_TOKENS.map((entry) => entry.id));
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
