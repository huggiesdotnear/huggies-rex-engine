// ========================================
// the chrome every smart-contract page shares: the page wrapper and
// the data-limitations box.
// ========================================
export interface HUGGIES_CONTRACT_LAYOUT_PROPS {
  title: string;
  children: preact.ComponentChildren;
  errors?: ReadonlyArray<string>;
}
// ========================================
// the shared wrapper for one smart-contract page.
export function huggies_contract_layout_fun(
  props: HUGGIES_CONTRACT_LAYOUT_PROPS,
): preact.JSX.Element {
  const errors = props.errors ?? [];

  return (
    <div class="huggies-contract-page huggies-page">
      {props.children}
      {errors.length > 0 && (
        <details class="huggies-contract-errors">
          <summary>DATA LIMITATIONS</summary>
          <ul>
            {errors.map((error) => (
              <li>{error}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
