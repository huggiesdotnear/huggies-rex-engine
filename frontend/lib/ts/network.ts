// ========================================
// this app is mainnet-only. one module owns that decision, so the
// "which network" question has exactly one answer in the codebase.
// ========================================
// --- WHY --- near-kit-tool-box/web keeps a separate connector per
// network and picks between them from the `network_id` key in
// localStorage. the key defaults to "mainnet" only when it is
// ABSENT — a returning user who once toggled to testnet still has
// "testnet" stored and would land on the testnet connector.
//
// the two connectors are not really independent: they share the
// `selected-wallet` key and the wallet's own storage namespace
// (`<walletId>:`), and near-connect's signOut() wipes that whole
// namespace regardless of network. so a network toggle is not a
// clean switch — it can take the other network's wallet session
// down with it.
//
// mainnet-only removes that whole class of problem: one connector,
// one wallet session, no cross-network interaction to reason about.
// ========================================
import { getStoredNetworkId, setNetwork_mainnet } from "@near-kit-tool-box/web";
// ========================================
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the network this app runs on.
export const HUGGIES_NETWORK = "mainnet" as const;
// ========================================
// ========================================
// ========================================
// --- HELPERS ----------------------------
// pin the stored network to mainnet.
// --- WHY --- the stored value is what near-kit-tool-box reads to
// choose a connector. a leftover "testnet" from an older build
// would silently point the whole app at the testnet connector, so
// the value is rewritten before anything reads it.
function pin_network_fun(): void {
  if (typeof localStorage === "undefined") return;
  setNetwork_mainnet();
}
// ========================================
// the network this app runs on, pinned to mainnet.
// --- WHY --- always goes through the library's own getter, so the
// value the app reports is the same one the connector picks. the
// pin runs first, so the getter can never return testnet.
export function huggies_network_fun(): "mainnet" | "testnet" {
  pin_network_fun();
  return getStoredNetworkId();
}
// ========================================
// ========================================
// ========================================
// --- RUN --------------------------------
// pin on import. every module that needs the network imports this
// one, so the pin happens before the first read of `network_id`.
// --- WHY --- an import-time side effect is the only way to be sure
// the value is correct no matter which module happens to be loaded
// first — the pages load import.ts, but a component can also be
// loaded on its own.
// --- WHY --- no `window` guard here. localStorage is the actual
// dependency, and pin_network_fun() already checks for it — a
// `window` check would skip the pin in a non-browser runtime that
// does have a storage (a test runner, a worker).
pin_network_fun();
// ========================================
// copyright 2026 by sleet.near
// ========================================
