// ========================================
// shared emoji-to-token mapping for the memory match game and the
// discover spotlight. one list, so they can never show a different set
// of memes.
//
// source: the emojifi project
// (https://gitlab.com/sleet-dev/sleet_vibe/emojifi), README + src/index.html.
// ========================================

// ========================================
// --- SHAPE ------------------------------
// `token_id` is null for the meme cooking label, which is a dao and not
// a token.
export interface HUGGIES_EMOJI_TOKEN {
  emoji: string;
  token_id: string | null;
  label: string;
  href: string | null;
}
// ========================================
// --- LIST -------------------------------
export const HUGGIES_EMOJI_TOKENS: ReadonlyArray<HUGGIES_EMOJI_TOKEN> = [
  {
    emoji: "🐶",
    token_id: "token.0xshitzu.near",
    label: "shitzu",
    href: "token/?id=token.0xshitzu.near",
  },
  {
    emoji: "💩",
    token_id: "shit-1170.meme-cooking.near",
    label: "shit",
    href: "token/?id=shit-1170.meme-cooking.near",
  },
  {
    emoji: "🐲",
    token_id: "blackdragon.tkn.near",
    label: "black dragon",
    href: "token/?id=blackdragon.tkn.near",
  },
  {
    emoji: "🦆",
    token_id: "duct-1078.meme-cooking.near",
    label: "duct",
    href: "token/?id=duct-1078.meme-cooking.near",
  },
  {
    emoji: "🗳️",
    token_id: "vote-1737.meme-cooking.near",
    label: "vote",
    href: "token/?id=vote-1737.meme-cooking.near",
  },
  {
    emoji: "🍂",
    token_id: "nearvember-337.meme-cooking.near",
    label: "near november",
    href: "token/?id=nearvember-337.meme-cooking.near",
  },
  {
    emoji: "🌸",
    token_id: "poppy-0.meme-cooking-test.near",
    label: "poppy",
    href: "token/?id=poppy-0.meme-cooking-test.near",
  },
  {
    emoji: "🍳",
    token_id: null,
    label: "meme cooking",
    href: "https://meme.cooking/",
  },
];
// ========================================
// copyright 2026 by sleet.near
// ========================================
