// ========================================
// the unit conversion page's form: the token card and the two amount inputs.
//
// ONE token — the contract address from the url — and ONE amount, seen
// two ways: the human amount a reader reads ("1.5") and the unit amount
// the chain trades ("1500000000000000000000000"). the reader types into
// EITHER box and the other shows the conversion, live.
//
// the token card opens the shared token picker: it is the app's one
// token picker, and the unit conversion page passes in what a pick
// means to it — the one token it converts.
//
// mounts into <div id="SHIT_1170_COMPONENT_UNIT_CONVERSION_FORM">.
import { render } from "preact";
import { ArrowDownUp, ChevronDown } from "lucide-preact";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_UNIT_CONVERSION_STORE } from "../../ts/unit-conversion/app_page_unit_conversion_store";
import { SHIT_1170_TOKEN_PICKER } from "../../ts/shared/token_picker";
import { use_page_store_fun } from "../../ts/shared/use_page_store";
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_UNIT_CONVERSION_FORM_FUN() {
  // --- WHY --- the store is read through the shared hook: preact only
  // re-renders a component when its OWN state changes, so the form
  // subscribes to the store and re-renders when it changes.
  const page = use_page_store_fun(SHIT_1170_APP_PAGE_UNIT_CONVERSION_STORE);

  const info = page.token_info;
  const symbol = info?.symbol ?? page.token;
  // the chain sees the contract address, so the card names it — the
  // reader pasting a ca recognizes it here.
  const token_id = info?.id ?? page.token;
  const icon = info?.icon ?? null;
  const decimals = info?.decimals ?? null;

  return (
    <section class="unit-conversion-form">
      <button
        type="button"
        class="unit-conversion-token"
        onClick={() => {
          void SHIT_1170_TOKEN_PICKER.open({
            label: "TOKEN",
            on_pick: (token_id) => {
              void SHIT_1170_APP_PAGE_UNIT_CONVERSION_STORE.set_token(token_id);
            },
          });
        }}
        title="choose the token to convert"
      >
        {icon !== null ? (
          <img class="unit-conversion-token-icon" src={icon} alt="" />
        ) : (
          <span class="unit-conversion-token-icon is-empty" />
        )}
        <span class="unit-conversion-token-copy">
          <strong>{symbol}</strong>
          <span title={token_id}>{token_id}</span>
        </span>
        <ChevronDown size={18} />
      </button>

      <label class="unit-conversion-field">
        <span class="unit-conversion-label">HUMAN</span>
        <input
          class="unit-conversion-input is-human"
          type="text"
          inputMode="decimal"
          value={page.human}
          placeholder="0.00"
          onInput={(event) => {
            const next = (event.currentTarget as HTMLInputElement).value;
            SHIT_1170_APP_PAGE_UNIT_CONVERSION_STORE.set_amount("human", next);
          }}
        />
      </label>

      <div class="unit-conversion-flip">
        <ArrowDownUp size={16} />
      </div>

      <label class="unit-conversion-field">
        <span class="unit-conversion-label">UNIT</span>
        <input
          class="unit-conversion-input is-unit"
          type="text"
          inputMode="numeric"
          value={page.unit}
          placeholder="0"
          onInput={(event) => {
            const next = (event.currentTarget as HTMLInputElement).value;
            SHIT_1170_APP_PAGE_UNIT_CONVERSION_STORE.set_amount("unit", next);
          }}
        />
      </label>

      <p class="unit-conversion-note">
        {decimals === null
          ? "LOADING TOKEN..."
          : `${symbol} HAS ${decimals} DECIMALS`}
      </p>
      {page.error !== null && <p class="unit-conversion-error">{page.error}</p>}
    </section>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_UNIT_CONVERSION_FORM;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_UNIT_CONVERSION_FORM_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
