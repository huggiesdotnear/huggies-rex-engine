// ========================================
// the dex-aggregator client, configured once for this app.
//
// the aggregator is the thing that turns "swap NEAR for USDT" into a
// list of ROUTES — one per dex that can serve the pair. this file owns
// the one client every quote goes through.
//
// WHAT THE CLIENT IS CONFIGURED WITH
//   referrer_id   ref.huggies.near — the account that gets the referral
//                 share of every swap this app routes.
//   dexes         the dexes that actually serve routes today. the
//                 package's KNOWN list still names a few that were
//                 removed upstream, so we ask for the ACTIVE ones and
//                 never see a dex that cannot quote.
//   level         "info" — route quote and live route-update diagnostics
//                 are printed to the browser console.
//
// everything else stays at the package's default: the router base url
// (https://router.intear.tech) and the per-request wait budget (2s).
//
// --- WHY THE REFERRER COMES FROM @huggies/shit-bin: the referral
// account is the same constant the rest of the shit-1170 tooling uses, so
// it is read from there instead of being written down a second time.
//
// --- WHY THE CONST AND NOT THE RESOLVER: the bin's barrel is
// browser-safe and exports both a plain const and a resolver. the
// resolver takes the network as an argument, and the network is
// something this file has to look up anyway — so the const is read
// here and the network picks the entry.
import {
  DEX_AGGREGATOR_ACTIVE_DEXES,
  DEX_AGGREGATOR_CLIENT,
} from "@sleet-js/intear-dex-aggregator-tool-box";
import { REFERRAL_ID_CONST } from "@huggies/shit-bin";
import { get_stored_network_id } from "@near-kit-tool-box/web";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the dexes that serve routes today. the package's KNOWN list also
// names the ones that were removed upstream, and asking for them costs
// nothing but earns nothing either.
const SHIT_1170_SWAP_DEXES = DEX_AGGREGATOR_ACTIVE_DEXES;
// ========================================
// ========================================
// --- REFERRER --------------------------
// the referral account for the network the app is on.
//
// --- WHY --- THE STORED NETWORK AND NOT THE ENVIRONMENT: this runs in
// a browser, where there is no NEAR_KIT_NETWORK variable, and the tool
// box's env package would default it to testnet — the wrong referral
// for a mainnet-only router.
//
// --- WHY --- A MISSING NETWORK ID FALLS BACK TO MAINNET: the app's
// network pin always sets it before this runs, and if it somehow did
// not, mainnet is the network this app and its router both live on.
function referral_id_fun(): string {
  const network_id = get_stored_network_id();
  return network_id === "testnet"
    ? REFERRAL_ID_CONST.testnet
    : REFERRAL_ID_CONST.mainnet;
}
// ========================================
// ========================================
// --- CLIENT ----------------------------
// the one client. quoting is read-only, so it holds no signer and no
// credentials.
const SHIT_1170_SWAP_REFERRER_ID = referral_id_fun();
const client = new DEX_AGGREGATOR_CLIENT({
  // The swap page needs a live view of the routes it receives, including
  // every socket update. `info` keeps the output useful without dumping
  // the complete route bodies; `debug` would add those bodies.
  level: "info",
})
  .WITH_REFERRER_ID(SHIT_1170_SWAP_REFERRER_ID)
  .WITH_DEFAULT_DEXES(SHIT_1170_SWAP_DEXES);
// ========================================
// ========================================
// --- PUBLIC ---------------------------
export const SHIT_1170_SWAP_AGGREGATOR = {
  client,
  referrer_id: SHIT_1170_SWAP_REFERRER_ID,
  dexes: SHIT_1170_SWAP_DEXES,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
