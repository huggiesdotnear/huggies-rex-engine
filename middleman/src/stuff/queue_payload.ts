// ========================================
// QUEUE_PAYLOAD
// the shape the engine's tx-queue accepts.
//
// the agent NEVER sends a transaction. it builds a payload and the
// engine queues it for a human to sign in the web app.
//
// this is NOT a near-kit transaction and NOT a `near.call`. it is
// data.
//
// --- WHY --- IT IS HERE AND NOT IN A SKILL: a queue payload is the
// engine's own wire shape, and the engine's wire shapes live with the
// engine's typed client. a skill that builds a payload should build it
// from the same place the engine documents it, so the two cannot drift.
//
// --- WHY --- THE VALIDATION IS HERE: a payload the engine cannot
// trust is a payload that moves the wrong thing. an empty contract id,
// an empty method, an args that is not an object, and a gas or deposit
// that is not a raw digit string are all refused at build time, where
// the mistake is still visible.
// ========================================

/**
 * one queued function call.
 *
 * `gas` and `deposit` are raw digit strings: gas units and yoctoNEAR.
 * the web app's `shared/gas_deposit.ts` also accepts near-kit's human
 * forms ("30 Tgas", "0.00125 NEAR", "1 yocto") and converts them, so
 * a hand-written payload may use either — but raw digits are the
 * unambiguous form and are what this helper emits.
 */
export interface QUEUE_CALL {
  contractId: string;
  method: string;
  args: Record<string, unknown>;
  gas: string;
  deposit: string;
}

/**
 * what goes into a queue payload.
 *
 * the gas and the deposit may be left out, and the defaults are used.
 */
export interface QUEUE_CALL_INPUT {
  contractId: string;
  method: string;
  args?: Record<string, unknown>;
  gas?: string;
  deposit?: string;
}

// 30 Tgas, the usual ceiling for a call that does real work.
export const DEFAULT_GAS = "30000000000000";
// no native NEAR attached.
export const DEFAULT_DEPOSIT = "0";

// raw digits only. "30 Tgas" and "0.00125 NEAR" are human forms the
// web app converts, but the queue payload itself carries raw units.
function raw_amount_fun(value: string, field: string): string {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `${field} must be a raw digit string (gas units or yoctoNEAR), got "${value}"`,
    );
  }
  return trimmed;
}

/**
 * build one queue payload.
 *
 * this does NOT send anything. it returns the data the engine queues
 * for a human to sign.
 */
export function queue_call_fun(input: QUEUE_CALL_INPUT): QUEUE_CALL {
  const contractId = input.contractId?.trim() ?? "";
  if (contractId.length === 0) {
    throw new Error("contractId is required");
  }

  const method = input.method?.trim() ?? "";
  if (method.length === 0) {
    throw new Error("method is required");
  }

  const args = input.args ?? {};
  if (typeof args !== "object" || args === null || Array.isArray(args)) {
    throw new Error("args must be a plain object");
  }

  const gas = raw_amount_fun(input.gas ?? DEFAULT_GAS, "gas");
  const deposit = raw_amount_fun(input.deposit ?? DEFAULT_DEPOSIT, "deposit");

  return { contractId, method, args, gas, deposit };
}
// ========================================
// copyright 2026 by sleet.near
