// ========================================
// the tokens pinned to the top of the discover list.
// ========================================
// the tokens we want a reader to see first, and why. this is a
// deliberate product list — NOT the old behaviour where every token
// the emojifi project happened to list was pinned. that list included
// test tokens, and pinning them meant the list never actually
// followed the chosen sort: a pinned token with tiny volume sat
// above the biggest one, and no direction could fix it.
//
// each entry keeps a reason, so the list stays a decision instead of
// becoming a pile of ids nobody can explain later.
// ========================================

// ========================================
// --- SHAPE ------------------------------
// one pinned token. `weight` orders the pinned block among itself,
// lowest first — so our own token sits above the rest.
export interface HUGGIES_PINNED_TOKEN {
  id: string;
  reason: string;
  weight: number;
}
// ========================================
// --- LIST -------------------------------
// the pinned tokens, in the order they should appear.
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
// copyright 2026 by sleet.near
// ========================================
