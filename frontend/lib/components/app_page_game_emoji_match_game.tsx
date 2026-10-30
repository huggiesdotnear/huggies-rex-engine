// ========================================
// eight-pair emoji memory match game component.
//
// the board and the score. the meme tokens it plays with live in
// lib/ts/app_page_game_emoji_tokens.ts, and the icons it draws on the cards
// come from the page's store.
//
// this component does not fetch. it reads the store and renders.
// ========================================
import { render } from "preact";
import {
  useEffect as use_effect,
  useRef as use_ref,
  useState as use_state,
} from "preact/hooks";
import { HUGGIES_EMOJI_TOKENS } from "../ts/app_page_game_emoji_tokens";
import { HUGGIES_APP_PAGE_GAME_STORE } from "../ts/app_page_game_store";
import { use_page_store_fun } from "../ts/use_page_store";
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
function HUGGIES_COMPONENT_EMOJI_MATCH_GAME_FUN() {
  // the page's icons, by token id. the store owns the load, so this only
  // reads.
  const page_data = use_page_store_fun(HUGGIES_APP_PAGE_GAME_STORE);
  const [cards, set_cards] =
    use_state<HUGGIES_EMOJI_CARD[]>(new_emoji_cards_fun);
  const [first_id, set_first_id] = use_state<number | null>(null);
  const [board_locked, set_board_locked] = use_state(false);
  const [matched_pairs, set_matched_pairs] = use_state(0);
  const [moves, set_moves] = use_state(0);
  // the pending unflip timer, held in a ref so a re-render can never
  // cancel it the way an effect cleanup does.
  const unflip_timer_ref = use_ref<number | null>(null);

  const icons = page_data?.icons ?? {};

  // clear the pending unflip when the component goes away.
  use_effect(() => {
    return () => {
      if (unflip_timer_ref.current !== null) {
        window.clearTimeout(unflip_timer_ref.current);
        unflip_timer_ref.current = null;
      }
    };
  }, []);

  // flip two cards back down after a mismatch.
  const unflip_pair_fun = (first: number, second: number) => {
    set_cards((current) =>
      current.map((card) =>
        card.id === first || card.id === second
          ? { ...card, revealed: false }
          : card,
      ),
    );
    set_first_id(null);
    set_board_locked(false);
  };

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

    // first card of a turn: hold it and wait for the second.
    if (first_id === null) {
      set_first_id(card_id);
      return;
    }

    // second card of a turn: compare it against the held card.
    const first = cards.find((item) => item.id === first_id);
    if (first === undefined) return;

    if (first.emoji === card.emoji) {
      set_cards((current) =>
        current.map((item) =>
          item.id === first_id || item.id === card_id
            ? { ...item, revealed: true, matched: true }
            : item,
        ),
      );
      set_first_id(null);
      set_matched_pairs((current) => current + 1);
      return;
    }

    // no match: hold the board, then flip both cards back down.
    set_board_locked(true);
    unflip_timer_ref.current = window.setTimeout(() => {
      unflip_timer_ref.current = null;
      unflip_pair_fun(first_id, card_id);
    }, 800);
  };

  const new_game_fun = () => {
    if (unflip_timer_ref.current !== null) {
      window.clearTimeout(unflip_timer_ref.current);
      unflip_timer_ref.current = null;
    }
    set_cards(new_emoji_cards_fun());
    set_first_id(null);
    set_board_locked(false);
    set_matched_pairs(0);
    set_moves(0);
  };

  const has_won = matched_pairs === HUGGIES_EMOJI_TOKENS.length;

  return (
    <section>
      <header>
        <h1>EMOJI MEMORY MATCH</h1>
        <p>Match all eight meme pairs.</p>
      </header>
      <div class="stats">
        <div class="stat">
          <strong>
            {matched_pairs}/{HUGGIES_EMOJI_TOKENS.length}
          </strong>
          <span>PAIRS MATCHED</span>
        </div>
        <div class="stat">
          <strong>{moves}</strong>
          <span>MOVES</span>
        </div>
      </div>
      <div class="grid" role="grid" aria-label="Memory game">
        {cards.map((card) => {
          const icon =
            card.token_id === null ? null : (icons[card.token_id] ?? null);
          return (
            <button
              type="button"
              class={`card${card.revealed ? " is-revealed" : ""}${card.matched ? " is-matched" : ""}`}
              disabled={card.matched}
              aria-label={
                card.revealed ? `Revealed ${card.emoji}` : "Hidden memory card"
              }
              onClick={() => reveal_card_fun(card.id)}
            >
              <span class="card-face">{card.revealed ? card.emoji : "?"}</span>
              {card.revealed && icon !== null && (
                <img class="card-icon" src={icon} alt="" />
              )}
            </button>
          );
        })}
      </div>
      {has_won && (
        <p class="win" role="status">
          🎉 You matched them all! You win! 🎉
        </p>
      )}
      <button type="button" class="new-game" onClick={new_game_fun}>
        NEW GAME
      </button>
    </section>
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
