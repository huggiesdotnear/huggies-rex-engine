// ========================================
// the placeholder body for the dex contract pages that are not
// built yet. the pool data these pages used to show is wrong, so
// they say so instead of showing it.
// ========================================
import { huggies_contract_layout_fun } from "./contract_layout";
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
      {huggies_contract_layout_fun({
        title: props.title,
        children: (
          <section>
            <h1>{props.title}</h1>
            <p>COMING SOON</p>
            <p class="huggies-contract-coming-soon-id">
              <code>{props.contract_id}</code>
            </p>
          </section>
        ),
      })}
    </>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
