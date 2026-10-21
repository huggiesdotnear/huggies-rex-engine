// ========================================
// RANDOM SLOGAN P
// a one-line <p> that renders a random entry out of
// HUGGIES_SLOGANS (see frontend/lib/ts/slogans.ts). mounts into
// the <p id="HUGGIES_COMPONENT_RANDOM_SLOGAN_P"> element the root
// landing page declares (see frontend/index.html) and swaps in a
// new slogan on every load, so the page reads differently each
// time someone opens it.
//
// the pick happens at render time, not at module load — the
// component reads it fresh inside the function body so a re-render
// (or a future re-mount) gets a new slogan without a reload.
//
// the index is derived from Math.random rather than
// crypto.getRandomValues on purpose: this is decoration, not
// security. Math.random is present in every JS runtime including
// SSR/node contexts, which keeps this module importable outside
// the browser without a guard.
//
// an empty slogan list is treated as "render nothing" rather than
// a crash — pick_random_slogan_fun returns null and the component
// bails out, so a truncated slogans.ts can never blank the page
// with an undefined.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_SLOGANS } from "../ts/slogans";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// pick_random_slogan_fun — choose one entry from the slogan list
// at random and return it. returns null when the list is empty so
// the caller can decide what to do instead of rendering nothing
// useful.
//
// the modulo is the standard uniform-pick trick: scale the [0, 1)
// float Math.random returns into the list's index range. Math.floor
// truncates toward zero, and for a non-negative float that is the
// same as taking the integer part, so the result is always a valid
// index in [0, HUGGIES_SLOGANS.length).
function pick_random_slogan_fun(): string | null {
  const COUNT = HUGGIES_SLOGANS.length;
  if (COUNT === 0) return null;
  const index = Math.floor(Math.random() * COUNT);
  return HUGGIES_SLOGANS[index];
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- COMPONENT --------------------------
// renders the chosen slogan, or nothing at all when the slogan
// list came back empty.
function HUGGIES_COMPONENT_RANDOM_SLOGAN_P_FUN() {
  // ========================================
  const slogan = pick_random_slogan_fun();
  if (slogan === null) {
    return <></>;
  }
  return <>{slogan}</>;
}
// ========================================
// ========================================
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount so the component file works as its own entry. looks
// for a <p id="HUGGIES_COMPONENT_RANDOM_SLOGAN_P"> on the page
// (added by frontend/index.html) and renders into it.
//
// the side effect is guarded by an id check so importing this
// module from another file (e.g. for testing) won't accidentally
// mount a second instance.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_RANDOM_SLOGAN_P;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_RANDOM_SLOGAN_P_FUN />, el);
}
// ========================================
