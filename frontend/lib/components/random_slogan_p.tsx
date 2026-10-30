// ========================================
// <p> that renders one random HUGGIES_SLOGANS entry per load.
// re-renders pick a fresh slogan (no module-load caching).
// --- WHY --- Math.random over crypto.getRandomValues: this is
// decoration, not security, and Math.random works in every runtime
// including SSR/node.
// ========================================
import { render } from "preact";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_SLOGANS } from "../ts/slogans";
// ========================================
// ========================================
// ========================================
// --- HELPERS ----------------------------
// uniform pick: null when the list is empty, so the component bails out
// cleanly rather than rendering undefined.
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
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_RANDOM_SLOGAN_P;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_RANDOM_SLOGAN_P_FUN />, el);
}
// ========================================
