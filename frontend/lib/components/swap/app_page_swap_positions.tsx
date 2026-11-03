// ========================================
// the swap page's position cards: what the signed-in account holds from
// its intear trades, one card per token.
//
// tapping a card fills the swap form with that position — the token
// goes on the IN side and the whole amount goes in the box — so the
// reader can sell it right away.
//
// the cards sit at the BOTTOM of the page, under the form and the
// routes: the swap is what the page is for, and the positions are the
// shortcut to it — the reader scrolls to them once they know what they
// want to swap.
//
// mounts into <div id="HUGGIES_COMPONENT_SWAP_POSITIONS">.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../../ts/shared/mount_ids";
import { HUGGIES_APP_PAGE_SWAP_POSITIONS_STORE } from "../../ts/swap/app_page_swap_positions_store";
import { HUGGIES_APP_PAGE_SWAP_STORE } from "../../ts/swap/app_page_swap_store";
import { HUGGIES_AUTH } from "../../ts/shared/auth_status";
import { HUGGIES_AMOUNT_FORMAT } from "../../ts/shared/token_amount_format";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { unit_to_human_fun } from "../../ts/swap/app_page_swap_amount";
import type { HUGGIES_SWAP_POSITION } from "../../ts/swap/app_page_swap_positions";
import type { HUGGIES_TOKEN_INFO } from "../../ts/shared/token_info";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the profit on a position, in usd, with more decimals than the shared
// usd formatter keeps.
//
// --- WHY --- THE SHARED FORMATTER IS NOT USED FOR THE PROFIT: it caps
// at two decimals, so a profit of $1.004 reads as "$1" — and a profit
// is the one number on the card where the cents matter. the VALUE
// still uses the shared formatter, because a value is a balance-like
// figure and reads the same everywhere in the app.
//
// --- WHY THE SIGN IS CARRIED BY THE NUMBER AND NOT BY A PREFIX: the
// shared usd formatter already puts the minus sign in front of the
// dollar sign, so a prefix of its own would print "-$1" twice over.
function pnl_text_fun(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs < 0.01) return "—";
  const sign = value < 0 ? "-" : "+";
  return `${sign}$${abs.toFixed(2)}`;
}
// ========================================
// ========================================
// --- VALUE ------------------------------
// what the position is worth NOW, and what it made.
//
// --- WHY THE VALUE COMES FROM THE PRICE AND NOT FROM THE API: the
// api's `cost_usd` is the PRICE PAID for the part still held — on the
// live rows it is exactly `bought_usd × (1 − sold / bought)` — so it
// is the basis, not the value. the value is the amount held times the
// token's price.
//
// --- WHY THE WHOLE POSITION IS COUNTED: the card is about the
// position, so the profit is the money already banked PLUS the money
// the held part has gained. a reader who sold half of a position at a
// profit and still holds the rest should see the whole gain.
function position_value_usd_fun(
  position: HUGGIES_SWAP_POSITION,
  info: HUGGIES_TOKEN_INFO | null,
): { value_usd: number; pnl_usd: number } {
  const decimals = info?.decimals ?? 0;
  const price_usd = info?.price_usd ?? 0;
  const amount = Number(position.amount) / 10 ** decimals;
  const value_usd = amount * price_usd;
  const pnl_usd = position.realized_pnl_usd + (value_usd - position.cost_usd);
  return { value_usd, pnl_usd };
}
// ========================================
// ========================================
// --- CARD ------------------------------
// one position card: the token, what is held, what it is worth and
// what it made.
//
// --- WHY THE CARD IS A BUTTON: tapping it is the whole point of the
// card — it fills the swap form with this position. so the card IS the
// action, and the reader never has to find a separate button.
function position_card_fun(
  position: HUGGIES_SWAP_POSITION,
  info: HUGGIES_TOKEN_INFO | null,
  is_filled: boolean,
): preact.JSX.Element {
  const symbol = info?.symbol ?? position.token;
  const decimals = info?.decimals ?? 0;
  // the amount held, in whole tokens.
  //
  // --- WHY --- THE TIDY FIGURE IS SHOWN AND NOT THE FULL ONE: a raw
  // 18-decimal amount is twenty-seven characters long and reads as
  // noise. the card shows the grouped, two-decimal figure, and the
  // exact one sits in the title — the same way the balance rows do it.
  const amount = HUGGIES_AMOUNT_FORMAT.balance(position.amount, { decimals });
  // the exact amount, for the title.
  const exact_amount = unit_to_human_fun(position.amount, decimals);
  // what it is worth now, and what it made.
  const { value_usd, pnl_usd } = position_value_usd_fun(position, info);
  const value = HUGGIES_AMOUNT_FORMAT.usd(value_usd);
  const pnl = pnl_text_fun(pnl_usd);
  return (
    <button
      type="button"
      class={
        is_filled
          ? "swap-position is-filled"
          : "swap-position"
      }
      onClick={() => {
        void HUGGIES_APP_PAGE_SWAP_STORE.fill_from_position(
          position.token,
          position.amount,
        );
      }}
      title={`sell ${exact_amount} ${symbol}`}
    >
      <div class="swap-position-head">
        {info !== null && info.icon !== null ? (
          <img class="swap-position-icon" src={info.icon} alt="" />
        ) : (
          <span class="swap-position-icon is-empty" />
        )}
        <strong>{symbol}</strong>
      </div>
      <div class="swap-position-amount">{amount}</div>
      <div class="swap-position-detail">
        <span>{value}</span>
        <span
          class={
            pnl_usd > 0
              ? "swap-position-pnl is-up"
              : pnl_usd < 0
                ? "swap-position-pnl is-down"
                : "swap-position-pnl"
          }
        >
          {pnl}
        </span>
      </div>
    </button>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_SWAP_POSITIONS_FUN() {
  // --- WHY --- the store is read through the shared hook: preact only
  // re-renders a component when its OWN state changes, so the cards
  // subscribe to the store and re-render when it changes.
  const page = use_page_store_fun(HUGGIES_APP_PAGE_SWAP_POSITIONS_STORE);
  // the swap store's pair, so a card can say which one is already on
  // the form.
  const swap = use_page_store_fun(HUGGIES_APP_PAGE_SWAP_STORE);
  const signed_in = HUGGIES_AUTH.is_signed_in();

  // --- WHY --- NOTHING IS DRAWN WHEN NOBODY IS SIGNED IN: the
  // positions belong to an account, and there is no account to ask
  // about. an empty box saying "no positions" would be a lie about a
  // page that simply has no positions to show.
  if (!signed_in) return <></>;

  return (
    <section class="swap-positions">
      <p class="swap-positions-note">YOUR POSITIONS</p>
      {page.loading && page.positions.length === 0 && (
        <p class="swap-positions-note">LOADING POSITIONS...</p>
      )}
      {!page.loading && page.error !== null && (
        <p class="swap-positions-note">POSITIONS FAILED</p>
      )}
      {!page.loading && page.error === null && page.positions.length === 0 && (
        <p class="swap-positions-note">NO OPEN POSITIONS</p>
      )}
      <div class="swap-position-list">
        {page.positions.map((position) =>
          position_card_fun(
            position,
            HUGGIES_APP_PAGE_SWAP_POSITIONS_STORE.get_info(position.token),
            swap.token_in === position.token,
          ),
        )}
      </div>
    </section>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SWAP_POSITIONS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SWAP_POSITIONS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
