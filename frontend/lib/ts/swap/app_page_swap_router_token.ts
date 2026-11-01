// ========================================
// turn our token ids into the ids the dex-aggregator router takes.
//
// the router accepts several flavours of a token id:
//   near             the chain's own NEAR
//   nep141:<account> a NEP-141 token
//
// our ids come from the intear registry, where NEAR is just "near"
// and every other token is its bare contract id. so the bare id is
// prefixed with `nep141:` before it goes to the router.
//
// --- WHY IT LIVES HERE AND NOT IN THE ROUTER CALL: the router's own
// docs say "normalize your own ids before calling to keep your UI in
// sync with the formatter". the id the router gets is also the id
// the route's `token_output` comes back as, so the two have to be
// built the same way.
import { HUGGIES_NEAR_ID } from "../shared/token_near";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the prefix the router wants in front of a NEP-141 contract id.
const HUGGIES_ROUTER_NEP141_PREFIX = "nep141:";
// ========================================
// ========================================
// --- PUBLIC ---------------------------
// the router's name for one of our token ids.
//
// --- WHY --- an id that already carries a flavour is left alone: the
// router has its own flavours (rhea-nep141:, intear-dex:) that mean
// something specific, and re-prefixing one of those would break it.
export function router_token_id_fun(token_id: string): string {
  const trimmed = token_id.trim();
  if (trimmed.length === 0) return trimmed;
  if (trimmed === HUGGIES_NEAR_ID) return HUGGIES_NEAR_ID;
  if (trimmed.includes(":")) return trimmed;
  return `${HUGGIES_ROUTER_NEP141_PREFIX}${trimmed}`;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
