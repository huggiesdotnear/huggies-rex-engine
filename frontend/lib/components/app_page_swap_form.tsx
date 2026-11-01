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
// mounts into <div id="HUGGIES_COMPONENT_SWAP_FORM">.
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/shared/mount_ids";
import { HUGGIES_APP_PAGE_SWAP_STORE } from "../ts/swap/app_page_swap_store";
import { HUGGIES_SWAP_TOKEN_PICKER } from "../ts/swap/app_page_swap_token_picker";
import { HUGGIES_APP_PAGE_SWAP_EXECUTE } from "../ts/swap/app_page_swap_execute";
import { HUGGIES_TOAST_STORE } from "../ts/swap/app_page_swap_toast_store";
import { HUGGIES_AUTH } from "../ts/shared/auth_status";
import { HUGGIES_AMOUNT_FORMAT } from "../ts/shared/token_amount_format";
import { use_page_store_fun } from "../ts/shared/use_page_store";
import { huggies_switch_direction_fun } from "./shared/switch_direction";
import {
  human_to_unit_fun,
  human_usd_fun,
  unit_to_human_fun,
  unit_to_raw_human_fun,
} from "../ts/swap/app_page_swap_amount";
import type { HUGGIES_TOKEN_INFO } from "../ts/shared/token_info";
// ========================================
// ========================================
// --- TYPES ------------------------------
// what one token card shows.
interface HUGGIES_SWAP_TOKEN_CARD {
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
  card: HUGGIES_SWAP_TOKEN_CARD,
  side: "in" | "out",
): preact.JSX.Element {
  return (
    <button
      type="button"
      class="swap-token"
      onClick={() => {
        void HUGGIES_SWAP_TOKEN_PICKER.open(side);
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
          {HUGGIES_AMOUNT_FORMAT.balance(card.balance, {
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
      : HUGGIES_AMOUNT_FORMAT.usd(human_usd_fun(human, { price_usd }));
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
function HUGGIES_COMPONENT_SWAP_FORM_FUN() {
  // --- WHY --- the store is read through the shared hook: preact only
  // re-renders a component when its OWN state changes, so the form
  // subscribes to the store and re-renders when it changes.
  const page = use_page_store_fun(HUGGIES_APP_PAGE_SWAP_STORE);

  const in_info = page.token_in_info;
  const out_info = page.token_out_info;

  const in_card: HUGGIES_SWAP_TOKEN_CARD = {
    id: page.token_in,
    symbol: in_info?.symbol ?? page.token_in,
    name: in_info?.symbol ?? page.token_in,
    icon: in_info?.icon ?? null,
    decimals: in_info?.decimals ?? 0,
    price_usd: in_info?.price_usd ?? 0,
    balance: HUGGIES_APP_PAGE_SWAP_STORE.get_balance(page.token_in),
  };
  const out_card: HUGGIES_SWAP_TOKEN_CARD = {
    id: page.token_out,
    symbol: out_info?.symbol ?? page.token_out,
    name: out_info?.symbol ?? page.token_out,
    icon: out_info?.icon ?? null,
    decimals: out_info?.decimals ?? 0,
    price_usd: out_info?.price_usd ?? 0,
    balance: HUGGIES_APP_PAGE_SWAP_STORE.get_balance(page.token_out),
  };

  // the amount the reader typed, as the unit amount the router wants.
  const amount_unit =
    in_info === null
      ? null
      : human_to_unit_fun(page.amount_in, in_info.decimals);

  // --- WHY --- the swap button needs the balance: it is disabled when
  // the reader is short, and that check is a comparison of the unit
  // amount against the raw balance. both are in the same unit, so the
  // comparison is exact.
  const signed_in = HUGGIES_AUTH.is_signed_in();
  const has_amount = amount_unit !== null && amount_unit !== "0";
  const has_balance =
    amount_unit !== null &&
    BigInt(amount_unit) <= BigInt(in_card.balance === "" ? "0" : in_card.balance);
  const route = HUGGIES_APP_PAGE_SWAP_STORE.get_selected_route();
  const can_swap =
    signed_in && has_amount && has_balance && route !== null && !page.swapping;

  const on_swap_fun = async () => {
    if (!can_swap || route === null) return;
    const account_id = HUGGIES_AUTH.get_account_id();
    if (account_id === null) return;
    const result = await HUGGIES_APP_PAGE_SWAP_EXECUTE.execute(
      route.raw,
      page.token_in,
      page.token_out,
      account_id,
    );
    if (result.succeeded) {
      HUGGIES_TOAST_STORE.show(
        "success",
        "SWAP DONE",
        result.amount_out === null
          ? null
          : `${unit_to_human_fun(result.amount_out, out_card.decimals)} ${out_card.symbol}`,
        result.tx_hash,
      );
    } else if (result.unknown) {
      HUGGIES_TOAST_STORE.show(
        "info",
        "SWAP SENT — CHECK IT",
        result.error,
        result.tx_hash,
      );
    } else {
      HUGGIES_TOAST_STORE.show("error", "SWAP FAILED", result.error, result.tx_hash);
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
          value={page.amount_in}
          placeholder="0.00"
          onInput={(event) => {
            const next = (event.currentTarget as HTMLInputElement).value;
            HUGGIES_APP_PAGE_SWAP_STORE.set_amount(next);
            void HUGGIES_APP_PAGE_SWAP_STORE.quote(
              page.token_in,
              page.token_out,
              next,
            );
          }}
        />
        {amount_note_fun(
          amount_unit,
          in_card.decimals,
          in_card.price_usd,
          page.amount_in,
        )}
      </div>

      {huggies_switch_direction_fun({
        on_switch: () => {
          void HUGGIES_APP_PAGE_SWAP_STORE.set_token("in", page.token_out);
          void HUGGIES_APP_PAGE_SWAP_STORE.set_token("out", page.token_in);
        },
      })}

      <div class="swap-side">
        {token_card_fun(out_card, "out")}
        <input
          class="swap-input is-out"
          type="text"
          inputMode="decimal"
          readOnly
          value={
            route === null || out_info === null
              ? ""
              : HUGGIES_AMOUNT_FORMAT.balance(route.amount_out, {
                  decimals: out_info.decimals,
                })
          }
          placeholder="0.00"
        />
        {amount_note_fun(
          route === null || out_info === null
            ? null
            : route.amount_out,
          out_card.decimals,
          out_card.price_usd,
          route === null ? "" : unit_to_human_fun(route.amount_out, out_card.decimals),
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
      {signed_in && !has_amount && page.amount_in.length > 0 && (
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
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_SWAP_FORM;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_SWAP_FORM_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
