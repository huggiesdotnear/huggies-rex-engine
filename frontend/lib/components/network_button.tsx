// ========================================
// mainnet / testnet toggle. mounts into a
// <div id="HUGGIES_COMPONENT_NETWORK_BUTTON">. active network
// comes from @near-kit-tool-box/web's getStoredNetworkId().
// ========================================
// --- WHY --- ensure_canonical_network_fun below is a
// workaround for a near-kit-tool-box bug: toggleNetwork() reads
// the raw localStorage value while getStoredNetworkId()
// normalizes (trim + lowercase), so a stored "MainNet" or
// "  testnet  " makes the label report one network while the
// toggle moves to the other. rewrite to canonical first so the
// label and the real network agree.
//   reported: https://github.com/sleet-js/near-kit-tool-box/issues/1
// when the bug is fixed, that helper + its mount-time call can
// be deleted; the rest of this file is correct on its own.
import { render } from "preact";
// aliased on import so call sites follow this repo's snake_case rule.
import { useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import {
  getStoredNetworkId,
  toggleNetwork,
  setNetwork_mainnet,
  NETWORK_STORAGE_KEY,
} from "@near-kit-tool-box/web";
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the only two networks NEAR runs, in toggle order. matches the
// "mainnet" | "testnet" union getStoredNetworkId() returns.
const HUGGIES_NETWORKS: ReadonlyArray<"mainnet" | "testnet"> = [
  "mainnet",
  "testnet",
];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// literal localStorage value, used only to detect dirty input —
// bypasses getStoredNetworkId() because that function hides dirtiness.
function read_raw_network_fun(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(NETWORK_STORAGE_KEY);
}
// ========================================
// true when the raw value is exactly one of the two networks,
// no padding / casing drift.
function is_canonical_network_fun(raw: string | null): boolean {
  if (raw === null) return false;
  return HUGGIES_NETWORKS.includes(raw as "mainnet" | "testnet");
}
// ========================================
// rewrite any dirty stored value to a canonical one. returns true
// when it wrote, so the caller can skip an unnecessary re-render.
// --- WHY --- the library has no setNetwork_testnet re-exported
// for the dirty-testnet branch, so write the key the way
// toggleNetwork() does — through localStorage directly.
function ensure_canonical_network_fun(): boolean {
  const raw = read_raw_network_fun();
  if (is_canonical_network_fun(raw)) return false;
  const reported = getStoredNetworkId();
  if (reported === "mainnet") {
    setNetwork_mainnet();
    return true;
  }
  localStorage.setItem(NETWORK_STORAGE_KEY, "testnet");
  return true;
}
// ========================================
// flip + read back, so the label always describes what
// getStoredNetworkId() will hand to the connector.
function toggle_fun(): "mainnet" | "testnet" {
  toggleNetwork();
  return getStoredNetworkId();
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- COMPONENT --------------------------
// state is seeded from getStoredNetworkId() and refreshed after
// every toggle so the label can never drift from the connector.
function HUGGIES_COMPONENT_NETWORK_BUTTON_FUN() {
  // ========================================
  const [current, set_current] = use_state(getStoredNetworkId());

  const on_click_fun = () => {
    set_current(toggle_fun());
  };

  return (
    <>
      <button
        type="button"
        onClick={on_click_fun}
        data-huggies-network={current}
      >
        {current.toUpperCase()}
      </button>
    </>
  );
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check. ensure_canonical_network_fun
// runs before the first render so the very first click toggles
// from a known-good value (see the file-header WHY note).
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_NETWORK_BUTTON;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    ensure_canonical_network_fun();
    render(<HUGGIES_COMPONENT_NETWORK_BUTTON_FUN />, el);
  }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
