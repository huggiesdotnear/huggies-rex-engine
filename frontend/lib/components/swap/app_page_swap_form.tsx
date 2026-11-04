// ========================================
// the swap page's form: the two token cards, the two amount inputs and
// the swap button.
//
// the token cards are the discover page's row, reused: an icon, the
// symbol, the name and the id. the amounts go through the shared
// amount formatter, so a balance never reads as "1500000" next to a
// ticker called USDC.
//
// the thin bar between the two cards is the shared switch direction
// bar, so the page that uses it does not carry its own.
//
// mounts into <div id="SHIT_1170_COMPONENT_SWAP_FORM">.
import { render } from "preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_SWAP_STORE } from "../../ts/swap/app_page_swap_store";
import { SHIT_1170_TOKEN_PICKER } from "../../ts/shared/token_picker";
import { SHIT_1170_APP_PAGE_SWAP_EXECUTE } from "../../ts/swap/app_page_swap_execute";
import { SHIT_1170_TOAST_STORE } from "../../ts/shared/toast_store";
import { SHIT_1170_AUTH } from "../../ts/shared/auth_status";
import { SHIT_1170_AMOUNT_FORMAT } from "../../ts/shared/token_amount_format";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
import { shit_1170_switch_direction_fun } from "./switch_direction";
import {
  human_to_unit_fun,
  human_usd_fun,
  unit_to_human_fun,
  unit_to_raw_human_fun,
} from "../../ts/swap/app_page_swap_amount";
import { swap_box_amount_fun } from "../../ts/swap/app_page_swap_box_amount";
import type { SHIT_1170_TOKEN_INFO } from "../../ts/shared/token_info";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what one token card shows.
interface SHIT_1170_SWAP_TOKEN_CARD {
  // the token's id.
  id: string;
  // its symbol, or the id when the symbol is unknown.
  symbol: string;
  // its name, or the id when the name is unknown.
  name: string;
  // its icon, or null when it has none.
  icon: string | null;
  // its decimals, for the unit conversions.
  decimals: number;
  // its usd price, for the value line.
  price_usd: number;
  // its raw balance, in the smallest unit.
  balance: string;
}
// ========================================
// ========================================
// --- CARD ------------------------------
// one token card: the icon, the symbol, the name, the balance under it.
//
// --- WHY --- THE BALANCE IS ITS OWN LINE AND NOT PART OF THE BUTTON:
// the button is what the reader clicks to open the picker, and a
// balance is information, not a label for the button. keeping them
// apart means the balance can be small without the button being small.
function token_card_fun(
  card: SHIT_1170_SWAP_TOKEN_CARD,
  side: "in" | "out",
): preact.JSX.Element {
  return (
    <button
      type="button"
      class="swap-token"
      onClick={() => {
        void SHIT_1170_TOKEN_PICKER.open({
          label: side === "in" ? "TOKEN IN" : "TOKEN OUT",
          on_pick: (token_id) => {
            void SHIT_1170_APP_PAGE_SWAP_STORE.set_token(side, token_id);
          },
        });
      }}
      title={`choose the ${side === "in" ? "token in" : "token out"}`}
    >
      {card.icon !== null ? (
        <img class="swap-token-icon" src={card.icon} alt="" />
      ) : (
        <span class="swap-token-icon is-empty" />
      )}
      <span class="swap-token-copy">
        <strong>{card.symbol}</strong>
        <span class="swap-token-balance">
          {SHIT_1170_AMOUNT_FORMAT.balance(card.balance, {
            decimals: card.decimals,
          })}
        </span>
      </span>
    </button>
  );
}
// ========================================
// ========================================
// --- AMOUNT LINE -----------------------
// the small line under an input: the unit amount and the usd value.
//
// --- WHY --- the unit amount is shown EXACTLY, with its trailing
// zeros: it is the number the chain sees, and the input's own figure
// is the tidied human one. the two side by side are what lets a
// reader check that the amount they typed is the amount that trades.
function amount_note_fun(
  unit: string | null,
  decimals: number,
  price_usd: number,
  human: string,
): preact.JSX.Element {
  if (unit === null) {
    return <span class="swap-note" />;
  }
  const raw_human = unit_to_raw_human_fun(unit, decimals);
  const usd =
    human.trim().length === 0
      ? "—"
      : SHIT_1170_AMOUNT_FORMAT.usd(human_usd_fun(human, { price_usd }));
  return (
    <span class="swap-note">
      <code>{raw_human}</code>
      <span>{usd}</span>
    </span>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_SWAP_FORM_FUN() {
  // --- WHY --- the store is read through the shared hook: preact only
  // re-renders a component when its OWN state changes, so the form
  // subscribes to the store and re-renders when it changes.
  const page = use_page_store_fun(SHIT_1170_APP_PAGE_SWAP_STORE);

  const in_info = page.token_in_info;
  const out_info = page.token_out_info;

  const in_card: SHIT_1170_SWAP_TOKEN_CARD = {
    id: page.token_in,
    symbol: in_info?.symbol ?? page.token_in,
    name: in_info?.symbol ?? page.token_in,
    icon: in_info?.icon ?? null,
    decimals: in_info?.decimals ?? 0,
    price_usd: in_info?.price_usd ?? 0,
    balance: SHIT_1170_APP_PAGE_SWAP_STORE.get_balance(page.token_in),
  };
  const out_card: SHIT_1170_SWAP_TOKEN_CARD = {
    id: page.token_out,
    symbol: out_info?.symbol ?? page.token_out,
    name: out_info?.symbol ?? page.token_out,
    icon: out_info?.icon ?? null,
    decimals: out_info?.decimals ?? 0,
    price_usd: out_info?.price_usd ?? 0,
    balance: SHIT_1170_APP_PAGE_SWAP_STORE.get_balance(page.token_out),
  };

  // the route the page is showing.
  const route = SHIT_1170_APP_PAGE_SWAP_STORE.get_selected_route();

  // --- WHY --- THE SIDE THE READER IS FIXING DECIDES WHICH BOX IS
  // FILLED: the reader typed into one box, and the router answered that
  // question. the box they typed into shows their number, and the other
  // box shows the answer.
  const side = page.amount_side;
  // the amount the reader typed, on the side they typed it.
  const fixed_human = side === "in" ? page.amount_in : page.amount_out;
  // the same amount in the token's smallest unit, so the line under the
  // box can show the figure the chain sees.
  const fixed_unit =
    side === "in"
      ? in_info === null
        ? null
        : human_to_unit_fun(fixed_human, in_info.decimals)
      : out_info === null
        ? null
        : human_to_unit_fun(fixed_human, out_info.decimals);
  // the amount the router answered with, on the other side.
  const answered_unit =
    route === null ? null : side === "in" ? route.amount_out : route.amount_in;

  // what each of the two boxes shows.
  const in_box = swap_box_amount_fun(
    "in",
    side,
    fixed_human,
    side === "in" ? fixed_unit : null,
    answered_unit,
    in_card.decimals,
    unit_to_human_fun,
  );
  const out_box = swap_box_amount_fun(
    "out",
    side,
    fixed_human,
    side === "out" ? fixed_unit : null,
    answered_unit,
    out_card.decimals,
    unit_to_human_fun,
  );

  // --- WHY --- the swap button needs the balance: it is disabled when
  // the reader is short, and that check is a comparison of the unit
  // amount against the raw balance. both are in the same unit, so the
  // comparison is exact.
  //
  // --- WHY --- THE AMOUNT THAT IS SOLD IS THE ROUTER'S ANSWER WHEN THE
  // READER FIXED THE OUTPUT: the reader said "I want this much OUT", so
  // the router answered how much IN it costs, and that is what leaves
  // their wallet. the balance check has to be against that number.
  //
  // --- WHY --- THE INPUT BOX IS THE ONE THAT MATTERS: the balance is
  // the balance of the token being SOLD, and that is always the input
  // token. so the check reads the input box's unit amount, which is
  // the reader's number when they fixed the input and the router's
  // answer when they fixed the output.
  const signed_in = SHIT_1170_AUTH.is_signed_in();
  const sold_unit = in_box.unit;
  const has_amount = sold_unit !== null && sold_unit !== "0";
  const has_balance =
    sold_unit !== null &&
    BigInt(sold_unit) <= BigInt(in_card.balance === "" ? "0" : in_card.balance);
  const can_swap =
    signed_in && has_amount && has_balance && route !== null && !page.swapping;

  const on_swap_fun = async () => {
    if (!can_swap || route === null) return;
    const account_id = SHIT_1170_AUTH.get_account_id();
    if (account_id === null) return;
    const result = await SHIT_1170_APP_PAGE_SWAP_EXECUTE.execute(
      route.raw,
      page.token_in,
      page.token_out,
      account_id,
    );
    if (result.succeeded) {
      SHIT_1170_TOAST_STORE.show(
        "success",
        "SWAP DONE",
        result.amount_out === null
          ? null
          : `${unit_to_human_fun(result.amount_out, out_card.decimals)} ${out_card.symbol}`,
        result.tx_hash,
      );
    } else if (result.unknown) {
      SHIT_1170_TOAST_STORE.show(
        "info",
        "SWAP SENT — CHECK IT",
        result.error,
        result.tx_hash,
      );
    } else {
      SHIT_1170_TOAST_STORE.show(
        "error",
        "SWAP FAILED",
        result.error,
        result.tx_hash,
      );
    }
  };

  return (
    <section class="swap-form">
      <div class="swap-side">
        {token_card_fun(in_card, "in")}
        <input
          class="swap-input"
          type="text"
          inputMode="decimal"
          value={in_box.human}
          placeholder="0.00"
          onInput={(event) => {
            const next = (event.currentTarget as HTMLInputElement).value;
            SHIT_1170_APP_PAGE_SWAP_STORE.set_amount("in", next);
            void SHIT_1170_APP_PAGE_SWAP_STORE.quote();
          }}
        />
        {amount_note_fun(
          in_box.unit,
          in_card.decimals,
          in_card.price_usd,
          in_box.human,
        )}
      </div>

      {shit_1170_switch_direction_fun({
        on_switch: () => {
          void SHIT_1170_APP_PAGE_SWAP_STORE.switch_direction();
        },
      })}

      <div class="swap-side">
        {token_card_fun(out_card, "out")}
        <input
          class="swap-input is-out"
          type="text"
          inputMode="decimal"
          value={out_box.human}
          placeholder="0.00"
          onInput={(event) => {
            const next = (event.currentTarget as HTMLInputElement).value;
            SHIT_1170_APP_PAGE_SWAP_STORE.set_amount("out", next);
            void SHIT_1170_APP_PAGE_SWAP_STORE.quote();
          }}
        />
        {amount_note_fun(
          out_box.unit,
          out_card.decimals,
          out_card.price_usd,
          out_box.human,
        )}
      </div>

      <button
        type="button"
        class="swap-go"
        disabled={!can_swap}
        onClick={() => {
          void on_swap_fun();
        }}
      >
        {page.swapping ? "SWAPPING..." : "SWAP"}
      </button>
      {!signed_in && <p class="swap-hint">SIGN IN TO SWAP</p>}
      {signed_in && !has_amount && fixed_human.length > 0 && (
        <p class="swap-hint">ENTER AN AMOUNT</p>
      )}
      {signed_in && has_amount && !has_balance && (
        <p class="swap-hint">NOT ENOUGH {in_card.symbol}</p>
      )}
    </section>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_SWAP_FORM;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_SWAP_FORM_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
