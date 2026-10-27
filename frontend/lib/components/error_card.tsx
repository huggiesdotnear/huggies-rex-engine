// ========================================
// a card that says one piece of the page could not be loaded.
//
// the component that shows a source's data owns that source's failure:
// it renders this card where the data would have been, so a reader is
// never left looking at zeros and wondering whether the account is
// empty or the contract could not be reached.
//
// this component does NOT fetch. it renders nothing when there is no
// error.
// ========================================
// ========================================
// --- PROPS ------------------------------
export interface HUGGIES_ERROR_CARD_PROPS {
  // the error message, or null when nothing failed.
  error: string | null;
  // what could not be loaded, e.g. "PLAYER DATA".
  label: string;
  // the css class prefix, e.g. "huggies-pumpopoly".
  class_prefix: string;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function huggies_error_card_fun(
  props: HUGGIES_ERROR_CARD_PROPS,
): preact.JSX.Element {
  // nothing failed — render nothing.
  if (props.error === null) return <></>;

  return (
    <>
      <div class={`${props.class_prefix}-error-card`}>
        <span class={`${props.class_prefix}-error-label`}>COULD NOT LOAD</span>
        <div class={`${props.class_prefix}-error-item`}>
          <strong class={`${props.class_prefix}-error-title`}>
            {props.label}
          </strong>
          <span class={`${props.class_prefix}-error-text`}>{props.error}</span>
        </div>
      </div>
    </>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
