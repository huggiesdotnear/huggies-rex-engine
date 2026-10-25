// ========================================
// the emoji entries that stand for a real token. the meme cooking
// entry is a dao and a label, not a token, so it has no id and no
// token detail page.
// ========================================
import { HUGGIES_EMOJI_TOKENS } from "./emoji_tokens";
import type { HUGGIES_EMOJI_TOKEN } from "./emoji_tokens";
// ========================================

// ========================================
// --- GET --------------------------------
// the emoji entries whose token_id is known.
export function emoji_token_entries_fun(): ReadonlyArray<HUGGIES_EMOJI_TOKEN> {
  return HUGGIES_EMOJI_TOKENS.filter(
    (entry): entry is HUGGIES_EMOJI_TOKEN & { token_id: string } =>
      entry.token_id !== null,
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
