// ========================================
// eight-pair emoji memory match game component.
// ========================================
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_EMOJI_TOKENS } from "../ts/emoji_tokens";
import { token_detail_href_fun } from "../ts/token_link";
import { HUGGIES_TOKEN_INFO } from "../ts/token_info";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
// ========================================
interface HUGGIES_EMOJI_CARD {
  id: number;
  emoji: string;
  token_id: string | null;
  revealed: boolean;
  matched: boolean;
}
// ========================================
// build a newly shuffled four-by-four card deck.
function new_emoji_cards_fun(): HUGGIES_EMOJI_CARD[] {
  const cards = HUGGIES_EMOJI_TOKENS.flatMap((token, token_index) =>
    [0, 1].map((copy_index) => ({
      id: token_index * 2 + copy_index,
      emoji: token.emoji,
      token_id: token.token_id,
      revealed: false,
      matched: false,
    })),
  );
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap_index = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swap_index]] = [cards[swap_index], cards[index]];
  }
  return cards;
}
// ========================================
// emoji memory match game component.
function HUGGIES_COMPONENT_EMOJI_MATCH_GAME_FUN() {
  const [cards, set_cards] =
    use_state<HUGGIES_EMOJI_CARD[]>(new_emoji_cards_fun);
  const [first_id, set_first_id] = use_state<number | null>(null);
  const [board_locked, set_board_locked] = use_state(false);
  const [matched_pairs, set_matched_pairs] = use_state(0);
  const [moves, set_moves] = use_state(0);
  const [icons, set_icons] = use_state<Record<string, string>>({});

  const token_ids = HUGGIES_EMOJI_TOKENS.map((token) => token.token_id).filter(
    (token_id): token_id is string => token_id !== null,
  );

  use_effect(() => {
    let cancelled = false;
    void HUGGIES_TOKEN_INFO.get(token_ids)
      .then((info_map) => {
        if (cancelled) return;
        const next_icons: Record<string, string> = {};
        for (const [token_id, info] of info_map) {
          if (info.icon !== null) next_icons[token_id] = info.icon;
        }
        set_icons(next_icons);
      })
      .catch(() => {
        // The emoji remains the fallback when live token icons are unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  use_effect(() => {
    if (first_id === null || board_locked) return;
    const second = cards.find(
      (card) => card.id !== first_id && card.revealed && !card.matched,
    );
    if (second === undefined) return;

    const first = cards.find((card) => card.id === first_id);
    if (first === undefined) return;

    if (first.emoji === second.emoji) {
      set_cards((current) =>
        current.map((card) =>
          card.id === first_id || card.id === second.id
            ? { ...card, revealed: true, matched: true }
            : card,
        ),
      );
      set_first_id(null);
      set_matched_pairs((current) => current + 1);
    } else {
      set_board_locked(true);
      const timeout = window.setTimeout(() => {
        set_cards((current) =>
          current.map((card) =>
            card.id === first_id || card.id === second.id
              ? { ...card, revealed: false }
              : card,
          ),
        );
        set_first_id(null);
        set_board_locked(false);
      }, 800);
      return () => window.clearTimeout(timeout);
    }
  }, [cards, first_id, board_locked]);

  const reveal_card_fun = (card_id: number) => {
    if (board_locked) return;
    const card = cards.find((item) => item.id === card_id);
    if (card === undefined || card.revealed || card.matched) return;

    set_moves((current) => current + 1);
    set_cards((current) =>
      current.map((item) =>
        item.id === card_id ? { ...item, revealed: true } : item,
      ),
    );
    if (first_id === null) set_first_id(card_id);
  };

  const new_game_fun = () => {
    set_cards(new_emoji_cards_fun());
    set_first_id(null);
    set_board_locked(false);
    set_matched_pairs(0);
    set_moves(0);
  };

  const has_won = matched_pairs === HUGGIES_EMOJI_TOKENS.length;

  return (
    <article class="huggies-emoji-game">
      <header class="huggies-emoji-game-header">
        <h1>EMOJI MEMORY MATCH</h1>
        <p>Match all eight meme pairs.</p>
      </header>
      <div class="huggies-emoji-game-stats">
        <span>
          SCORE: <strong>{matched_pairs}</strong>/8
        </span>
        <span>
          MOVES: <strong>{moves}</strong>
        </span>
      </div>
      <div class="huggies-emoji-game-grid" role="grid" aria-label="Memory game">
        {cards.map((card) => {
          const icon =
            card.token_id === null ? null : (icons[card.token_id] ?? null);
          return (
            <button
              type="button"
              class={`huggies-emoji-game-card${card.revealed ? " revealed" : ""}${card.matched ? " matched" : ""}`}
              disabled={card.matched}
              aria-label={
                card.revealed ? `Revealed ${card.emoji}` : "Hidden memory card"
              }
              onClick={() => reveal_card_fun(card.id)}
            >
              <span class="huggies-emoji-game-card-face">
                {card.revealed ? card.emoji : "?"}
              </span>
              {card.revealed && icon !== null && (
                <img class="huggies-emoji-game-card-icon" src={icon} alt="" />
              )}
            </button>
          );
        })}
      </div>
      {has_won && (
        <p class="huggies-emoji-game-win" role="status">
          🎉 You matched them all! You win! 🎉
        </p>
      )}
      <button
        type="button"
        class="huggies-emoji-game-new-game"
        onClick={new_game_fun}
      >
        NEW GAME
      </button>
      <footer class="huggies-emoji-game-footer">
        <h2>MEME TOKENS</h2>
        <ul>
          {HUGGIES_EMOJI_TOKENS.map((token) => (
            <li key={token.emoji}>
              {token.token_id !== null ? (
                <a href={token_detail_href_fun(token.token_id)}>
                  {token.emoji} {token.label} ({token.token_id})
                </a>
              ) : (
                <a
                  href="https://meme.cooking/"
                  target="_blank"
                  rel="noreferrer"
                >
                  {token.emoji} {token.label} (meme.cooking)
                </a>
              )}
            </li>
          ))}
        </ul>
        <p>this is not financial advice</p>
      </footer>
    </article>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_EMOJI_MATCH_GAME;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_EMOJI_MATCH_GAME_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
