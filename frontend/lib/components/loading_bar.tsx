// ========================================
// the loading progress bar: the thin bar pinned to the top of the
// screen that shows how much of the page's fetching is done.
//
// it reads the app-wide loading signal (lib/ts/loading_bar.ts) and
// paints it. it fetches nothing itself — the signal is fed by the
// global fetch, so every request the page makes counts, whether it
// comes from the page's loader, the token cache or a LOAD MORE.
//
// --- WHY IT IS NOT A PER-PAGE COMPONENT: the bar belongs to the
// browser window, not to a page. it is the same on every page and it
// must be there before the page's own load starts, so it mounts from
// the shared import (lib/ts/import.ts) rather than from a page.
//
// --- WHY THE BAR IS NOT A SPINNER: a spinner says "something is
// happening" and never says how much is left. a bar that fills as the
// answers land tells the reader that the page is moving.
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_LOADING_BAR } from "../ts/loading_bar";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_LOADING_BAR_FUN() {
  const [progress, set_progress] = use_state(0);

  // --- WHY the signal is installed here and not at import time: the
  // component's effect runs when it mounts, which is before the page's
  // own load starts (the page's start script runs on the html parse,
  // the components mount after it). so nothing is missed.
  use_effect(() => {
    HUGGIES_LOADING_BAR.install();
    // read the current value right away, so a page that was already
    // fetching when the bar mounted does not start at zero.
    set_progress(HUGGIES_LOADING_BAR.get_progress());
    return HUGGIES_LOADING_BAR.subscribe(() => {
      set_progress(HUGGIES_LOADING_BAR.get_progress());
    });
  }, []);

  const percent = `${Math.round(progress * 100)}%`;

  return (
    <div
      class="loading-bar-track"
      role="progressbar"
      aria-label="loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      {/* the glow. it is its own element and it is NOT transparent —
          the blur is what makes it a glow, so the light it throws is
          solid light and not a wash over the page. */}
      <div class="loading-bar-glow" style={{ width: percent }} />
      {/* the fill. fully opaque, so it is the exact middle colour. */}
      <div class="loading-bar-fill" style={{ width: percent }} />
    </div>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID = HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_LOADING_BAR;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<HUGGIES_COMPONENT_LOADING_BAR_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
