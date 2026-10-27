// ========================================
// the id jump box: a text field and a button that open an id on the
// current page.
//
// several pages have one of these and they all do the same thing —
// pumpopoly takes an account id, the token page takes a token id, the
// DAO page takes a dao id. only the wording differs, so the wording
// comes in as props.
//
// the url parameter it writes is a prop too, so a page can use `?id=`
// or `?dao_id=` without a second component.
//
// the css is driven by a class_prefix prop: the component writes
// `<prefix>-selector`, `<prefix>-input` and `<prefix>-open`, and the
// page's css file carries those rules.
// ========================================
import { useState as use_state } from "preact/hooks";
// ========================================
// ========================================
// --- PROPS ------------------------------
export interface HUGGIES_ACCOUNT_ID_SELECTOR_PROPS {
  // the id the page is currently showing. it seeds the input, so the
  // field starts out holding the id that is on screen.
  account_id: string | null;
  // the label above the field, e.g. "ACCOUNT ID".
  label: string;
  // the placeholder inside the field, e.g. "account.near".
  placeholder: string;
  // the button text, e.g. "OPEN ACCOUNT".
  button_text: string;
  // the url parameter the id is written to. "id" for most pages,
  // "dao_id" for the DAO page.
  param_name: string;
  // the css class prefix, e.g. "huggies-pumpopoly".
  class_prefix: string;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function huggies_account_id_selector_fun(
  props: HUGGIES_ACCOUNT_ID_SELECTOR_PROPS,
): preact.JSX.Element {
  const [input_id, set_input_id] = use_state<string>(props.account_id ?? "");

  // --- WHY --- the input is seeded from props on mount only. a later
  // change of the page's id must not overwrite what the user is
  // typing, but a fresh page load must start from the url's id.
  const open_fun = () => {
    const next_id = input_id.trim();
    if (next_id.length === 0) return;
    const url = new URL(window.location.href);
    url.searchParams.set(props.param_name, next_id);
    window.location.href = url.toString();
  };

  return (
    <section class={`${props.class_prefix}-selector`}>
      <label class={`${props.class_prefix}-input`}>
        <span>{props.label}</span>
        <input
          type="text"
          value={input_id}
          placeholder={props.placeholder}
          onInput={(event) => {
            set_input_id((event.currentTarget as HTMLInputElement).value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") open_fun();
          }}
        />
      </label>
      <button
        type="button"
        class={`${props.class_prefix}-open`}
        onClick={open_fun}
      >
        {props.button_text}
      </button>
    </section>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
