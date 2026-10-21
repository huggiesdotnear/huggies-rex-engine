// ========================================
// NETWORK BUTTON
// shows the currently-active NEAR network (mainnet / testnet) and
// flips to the other one on click. mounts into a
// <button id="HUGGIES_COMPONENT_NETWORK_BUTTON"> that the app pages
// declare (see frontend/app/*.html), sitting just above the nav.
//
// the active network comes from getStoredNetworkId() in
// @near-kit-tool-box/web, which reads localStorage["network_id"]
// and falls back to "mainnet" when nothing is stored. the click
// itself is toggleNetwork(), which writes the opposite value back.
//
// WORKAROUND — the two library functions disagree on dirty values.
// toggleNetwork() reads localStorage RAW while getStoredNetworkId()
// normalizes ( `raw || "mainnet"`, then trim + lowercase ). so a
// stored "MainNet" or "  testnet  " makes the label report one
// network while the toggle moves to the other — the user silently
// ends up on a chain they did not pick. ensure_canonical_network_fun
// below rewrites any non-canonical value to "mainnet" via
// setNetwork_mainnet() before we ever display or toggle, so the
// label and the real network always agree.
// reported upstream:
//   https://github.com/sleet-js/near-kit-tool-box/issues/1
// once it is fixed, ensure_canonical_network_fun can be deleted and
// the mount-time call to it dropped — the rest of this file is
// already correct on its own.
//
// mainnet is the first-load default: getStoredNetworkId() already
// reports "mainnet" for an empty localStorage, and the same call to
// setNetwork_mainnet() makes that default explicit on disk so the
// first toggle lands on testnet rather than resolving mainnet
// again from an empty read.
//
// every library function here touches localStorage at call time,
// never at import time, and all of them are called from inside the
// guarded blocks below — so importing this module outside a browser
// is inert.
// ========================================
import { render } from "preact";
// preact exports this hook as `useState`; it is aliased on import so
// the call sites below follow this repo's snake_case rule without
// renaming the upstream export.
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
// the only two networks NEAR runs, in the order the button cycles
// them. matches the "mainnet" | "testnet" union the library's
// getStoredNetworkId() returns.
const HUGGIES_NETWORKS: ReadonlyArray<"mainnet" | "testnet"> = [
  "mainnet",
  "testnet",
];
// ========================================
// --- HELPERS ----------------------------
// read_raw_network_fun — the literal string sitting in localStorage,
// exactly as written. used only to detect a dirty value, which is
// why it deliberately does NOT go through getStoredNetworkId() —
// that function hides the dirtiness we are looking for.
//
// SSR guard returns null so the mount-time check below can skip
// its localStorage work entirely outside the browser.
function read_raw_network_fun(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(NETWORK_STORAGE_KEY);
}
// ========================================
// is_canonical_network_fun — true when the raw stored value is
// exactly one of the two networks, with no padding or casing drift.
// this is the same comparison toggleNetwork() does internally, so
// passing it guarantees toggleNetwork() cannot disagree with us.
function is_canonical_network_fun(raw: string | null): boolean {
  if (raw === null) return false;
  return HUGGIES_NETWORKS.includes(raw as "mainnet" | "testnet");
}
// ========================================
// ensure_canonical_network_fun — make localStorage safe to toggle.
//
// four outcomes:
//   nothing stored        → setNetwork_mainnet()  (first-load
//                            default is mainnet, made explicit)
//   exactly "mainnet"     → nothing to do
//   exactly "testnet"     → nothing to do
//   anything else / dirty → setNetwork_mainnet()  (rebuild from the
//                            value getStoredNetworkId() reports, so
//                            a hand-set "  testnet  " keeps its
//                            meaning instead of snapping to
//                            mainnet)
//
// returns true when it wrote, so the caller can skip the render
// that would otherwise happen anyway.
function ensure_canonical_network_fun(): boolean {
  const raw = read_raw_network_fun();
  if (is_canonical_network_fun(raw)) return false;
  const reported = getStoredNetworkId();
  if (reported === "mainnet") {
    setNetwork_mainnet();
    return true;
  }
  // reported === "testnet": the raw value was dirty testnet. the
  // library has no setNetwork_testnet re-exported from here in a
  // form we rely on for this path, so write the key the same way
  // toggleNetwork() does — via localStorage directly, using the
  // library's own key constant.
  localStorage.setItem(NETWORK_STORAGE_KEY, "testnet");
  return true;
}
// ========================================
// toggle_fun — flip the network and return the value the library
// now reports.
//
// calls toggleNetwork() exactly as the library intends, then reads
// the network back with getStoredNetworkId() rather than assuming
// the flip landed where we predicted. that way the label always
// describes what getStoredNetworkId() will hand to near_kit_client(),
// even if the library's toggle rules change.
function toggle_fun(): "mainnet" | "testnet" {
  toggleNetwork();
  return getStoredNetworkId();
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- COMPONENT --------------------------
// the network lives in preact state so a click repaints the label
// through the normal render path. the state is seeded from
// getStoredNetworkId() (the library's single source of truth) and
// refreshed from it after every toggle, so the label can never
// drift from what near_kit_client() would return.
//
// returns a fragment, exactly like HUGGIES_COMPONENT_NAV_FUN, so
// this component contributes only the <button> and never adds a
// wrapper of its own.
//
// the rendered <button> deliberately does NOT carry the mount id.
// the id belongs to the page's own <div>, and preact renders into
// that element — putting the id on the button too would mean two
// elements claiming the same id. with a <div> mount this whole
// class of nesting bug is gone: there is never a button inside a
// button.
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
// self-mount so the component file works as its own entry. looks
// for a <div id="HUGGIES_COMPONENT_NETWORK_BUTTON"> on the page
// (added by the frontend/app/*.html pages) and renders into it.
//
// the side effect is guarded by an id check so importing this
// module from another file won't accidentally mount a second
// instance.
//
// before the first render we canonicalize localStorage, so the very
// first click already toggles from a known-good value.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_NETWORK_BUTTON;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) {
    ensure_canonical_network_fun();
    render(<HUGGIES_COMPONENT_NETWORK_BUTTON_FUN />, el);
  }
}
// ========================================
