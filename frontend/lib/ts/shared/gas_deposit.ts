// ========================================
// the gas and the deposit of a queued call, in the numbers the wallet
// wants.
//
// the toolbox converts these internally, but it does not export the
// conversion, so the app carries its own small versions of the same two
// rules. the rules are the toolbox's:
//
//   gas:     raw gas units pass through. "30 Tgas" becomes 30000000000000.
//   deposit: raw yoctoNEAR passes through. "1 NEAR" becomes
//            1000000000000000000000000. "1 yocto" becomes 1.
//
// --- WHY --- the queue stores what the agent wrote: an agent writes
// "30 Tgas" because that is how a human says it, and the wallet wants
// the raw number. so the conversion has to happen somewhere between the
// queue and the wallet, and this is it.
//
// --- WHY --- IT THROWS ON ANYTHING ELSE: a gas or a deposit that this
// cannot read is a call the app does not understand. sending it as
// something else would put a wrong number on the chain, so it stops
// here and the reader is told.
const SHIT_1170_TGAS = 1_000_000_000_000n;
const SHIT_1170_NEAR_DECIMALS = 24;
// ========================================
// ========================================
// --- HELPERS ----------------------------
// a number of digits and nothing else.
function is_digits_fun(value: string): boolean {
  return /^\d+$/.test(value);
}
// ========================================
// ========================================
// --- GAS -------------------------------
// the gas of one queued call, in raw gas units.
//
// --- WHY --- a "Tgas" value may carry a fraction: "0.3 Tgas" is a real
// gas figure, so the fraction is kept and rounded to the nearest unit.
export function shit_1170_gas_fun(gas: string | null | undefined): string {
  if (gas === undefined || gas === null) return "30000000000000";
  const trimmed = gas.trim();
  if (trimmed.length === 0) {
    throw new Error("A queued call's gas must not be empty");
  }
  if (is_digits_fun(trimmed)) return trimmed;
  const tgas = /^(\d+(?:\.\d+)?)\s*Tgas$/.exec(trimmed);
  if (tgas !== null && tgas[1] !== undefined) {
    return BigInt(
      Math.round(Number(tgas[1]) * Number(SHIT_1170_TGAS)),
    ).toString();
  }
  throw new Error(
    `A queued call's gas must be raw gas units or a "Tgas" value; got "${gas}"`,
  );
}
// ========================================
// ========================================
// --- DEPOSIT ---------------------------
// the deposit of one queued call, in raw yoctoNEAR.
//
// --- WHY --- a NEAR amount may carry a fraction: "0.5 NEAR" is a real
// deposit, and it is scaled by the protocol's own twenty-four decimals.
//
// --- WHY --- a "yocto" amount is read as a whole number of yoctoNEAR:
// that is the word for it, and it is one unit.
export function shit_1170_deposit_fun(
  deposit: string | null | undefined,
): string {
  if (deposit === undefined || deposit === null) return "0";
  const trimmed = deposit.trim();
  if (is_digits_fun(trimmed)) return BigInt(trimmed).toString();
  const yocto = /^(\d+)\s*yocto$/.exec(trimmed);
  if (yocto !== null && yocto[1] !== undefined) {
    return BigInt(yocto[1]).toString();
  }
  const near = /^(\d+(?:\.\d+)?)\s*NEAR$/.exec(trimmed);
  const near_value = near !== null ? near[1] : undefined;
  if (near_value !== undefined) {
    const [whole = "0", fraction = ""] = near_value.split(".");
    const scale = BigInt(10) ** BigInt(SHIT_1170_NEAR_DECIMALS);
    const padded = (fraction + "0".repeat(SHIT_1170_NEAR_DECIMALS)).slice(
      0,
      SHIT_1170_NEAR_DECIMALS,
    );
    const fraction_amount = padded.length === 0 ? 0n : BigInt(padded);
    return (BigInt(whole) * scale + fraction_amount).toString();
  }
  throw new Error(
    `A queued call's deposit must be raw yoctoNEAR or an amount with a unit; got "${deposit}"`,
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
