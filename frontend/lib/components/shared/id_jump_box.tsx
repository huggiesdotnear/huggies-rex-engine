// ========================================
// the id jump box: a text field and a button that open an id on the
// current page.
//
// several pages have one of these and they all do the same thing —
// pumpopoly takes an account id, the token page takes a token id, the DAO
// page takes a dao id. only the wording differs, so the wording and the url
// parameter come in as props.
//
// the css is driven by a class_prefix prop: the component writes
// `<prefix>-selector`, `<prefix>-input` and `<prefix>-open`, and the
// page's css file carries those rules.
//
// --- WHY --- named `id_jump_box` and not `account_id_selector`: the
// thing it opens is an id of some kind. a token id is an account id on
// NEAR, but calling it an account id on a token page reads wrong, so
// the name says "id" and leaves the kind to the page that uses it.
// ========================================
import { useState as use_state } from "preact/hooks";
// ========================================
// ========================================
// --- PROPS ------------------------------
export interface HUGGIES_ID_JUMP_BOX_PROPS {
  // the id the page is currently showing. it seeds the input, so the
  // field starts out holding the id on screen.
  id: string | null;
  // the label above the field, e.g. "ACCOUNT ID".
  label: string;
  // the placeholder inside the field, e.g. "account.near".
  placeholder: string;
  // the button text, e.g. "OPEN TOKEN" or "INSPECT PLAYER ACCOUNT".
  button_text: string;
  // the url parameter the id is written to. "id" for most pages,
  // "dao_id" for the DAO page.
  param_name: string;
  // the css class prefix, e.g. "pumpopoly".
  class_prefix: string;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function huggies_id_jump_box_fun(
  props: HUGGIES_ID_JUMP_BOX_PROPS,
): preact.JSX.Element {
  const [input_id, set_input_id] = use_state<string>(props.id ?? "");

  // --- WHY --- the input is seeded from props on mount only. a later
  // change of the page's id must not overwrite what the user is typing,
  // but a fresh page load must start from the url's id.
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
} // ========================================
// copyright 2026 by sleet.near
// ========================================
