// ========================================
// one token amount, with the token's icon, its symbol and its usd
// worth.
//
// the transaction page's transfers and the account page's transaction
// cards both show a token amount, and both render through this, so the
// two cannot drift.
//
// --- WHY IT IS A SHARED COMPONENT AND NOT A HELPER: an amount with
// an icon beside it is markup, not a string. two copies of that markup
// would drift, exactly as two copies of the amount formatting did
// before lib/ts/shared/token_amount_row.ts took it over.
//
// --- WHY THE RAW AMOUNT IS IN THE TITLE: the amount on screen is
// divided by the token's decimals, and a reader who wants the exact
// number the chain recorded needs the raw one. the title carries it,
// so a hover shows "1500000" and the row itself stays readable. the
// raw number is never the primary figure — a bare integer in the
// token's smallest unit is not a number a reader can read.
import { HUGGIES_AMOUNT_FORMAT } from "../../ts/shared/token_amount_format";
import type { HUGGIES_TRANSFER_TOKEN } from "../../ts/shared/transfer_tokens";
// ========================================
// ========================================
// --- ICON ------------------------------
// the token's icon, or a neutral dot when it has none.
//
// --- WHY THE EMPTY DOT AND NOT NOTHING: every row keeps the same
// alignment whether or not the token has an icon, so the amounts line
// up down the page.
export function huggies_transfer_icon_fun(
  token: HUGGIES_TRANSFER_TOKEN | null,
): preact.JSX.Element {
  if (token === null || token.icon === null) {
    return <span class="tx-token-icon is-empty" aria-hidden="true" />;
  }
  return (
    <img
      class="tx-token-icon"
      src={token.icon}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      title={token.symbol}
    />
  );
}
// ========================================
// ========================================
// --- AMOUNT ----------------------------
// the amount, the symbol and the usd worth.
//
// --- WHY THE AMOUNT IS DIVIDED WHEN THE TOKEN IS KNOWN: a token
// amount is an integer in the token's smallest unit, so it only means
// something once it is divided by 10**decimals. with the token's
// decimals known, "1500000" is 1.5 USDC.
//
// --- WHY AN UNKNOWN TOKEN SHOWS THE RAW AMOUNT: without the decimals
// there is nothing to divide by, and dividing by a guessed number
// would be a lie. the raw integer is shown with the contract id
// beside it, so the reader knows exactly what the chain recorded.
export function huggies_transfer_amount_fun(props: {
  amount: string;
  token: HUGGIES_TRANSFER_TOKEN | null;
  // the contract the amount came from, shown when the token is unknown.
  contract_id?: string;
}): preact.JSX.Element {
  const { amount, token, contract_id } = props;
  // an unknown token: the raw number, and the contract it came from.
  if (token === null) {
    return (
      <span class="tx-token-amount">
        <span class="tx-token-raw">{amount}</span>
        {contract_id !== undefined && contract_id.length > 0 && (
          <code class="tx-token-contract">{contract_id}</code>
        )}
      </span>
    );
  }
  const display = HUGGIES_AMOUNT_FORMAT.balance(amount, {
    decimals: token.decimals,
  });
  const usd = HUGGIES_AMOUNT_FORMAT.usd(
    HUGGIES_AMOUNT_FORMAT.balance_usd(amount, {
      decimals: token.decimals,
      price_usd: token.price_usd,
    }),
  );
  return (
    <span class="tx-token-amount">
      <span class="tx-token-value" title={`${amount} units ${token.symbol}`}>
        {display}
      </span>
      <span class="tx-token-symbol">{token.symbol}</span>
      {usd !== "—" && <span class="tx-token-usd">{usd}</span>}
    </span>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
