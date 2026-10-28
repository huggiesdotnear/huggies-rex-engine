// ========================================
// the placeholder body for the dex contract pages that are not
// built yet. the pool data these pages used to show is wrong, so
// they say so instead of showing it.
//
// the page is just the h1, the notice and the contract id — no
// wrapper. main is the page column, and a wrapper div around the
// content would only nest one box inside another.
// ========================================
export interface HUGGIES_CONTRACT_COMING_SOON_PROPS {
  title: string;
  contract_id: string;
}
// ========================================
// render the placeholder for one dex contract page.
export function huggies_contract_coming_soon_fun(
  props: HUGGIES_CONTRACT_COMING_SOON_PROPS,
): preact.JSX.Element {
  return (
    <>
      <h1>{props.title}</h1>
      <p>COMING SOON</p>
      <p class="coming-soon-id">
        <code>{props.contract_id}</code>
      </p>
    </>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
