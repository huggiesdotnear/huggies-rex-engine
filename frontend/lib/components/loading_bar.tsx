// ========================================
// the loading progress bar: the thin bar pinned to the top of the
// screen that shows how much of the page's fetching is done.
//
// it reads the app-wide loading signal (lib/ts/loading_bar.ts) and
// paints it. it fetches nothing itself — the signal is fed by the
// global fetch and by the counted icon component, so every request
// and every image the page makes counts, whether it comes from the
// page's loader, the token metadata cache, the icon loader or a LOAD
// MORE.
//
// --- WHY IT IS NOT A PER-PAGE COMPONENT: the bar belongs to the
// browser window, not to a page. it is the same on every page and it
// must be there before the page's own load starts, so it mounts from
// the shared import (lib/ts/import.ts) rather than from a page.
//
// --- WHY THE BAR IS NOT A SPINNER: a spinner says "something is
// happening" and never says how much is left. a bar that fills as the
// answers land tells the reader that the page is moving.
//
// --- WHY THE MOTION IS CSS: the component sets the fill's WIDTH and
// nothing else. the css transitions that width with an ease-in-out
// curve, so the browser does the animating. a javascript animation
// would have to run on a timer to fake the same thing, and it would
// stutter while the page's own fetches are hogging the main thread.
import { render } from "preact";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_LOADING_BAR } from "../ts/loading_bar";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_LOADING_BAR_FUN() {
  // --- WHY THE INITIAL VALUE IS READ RIGHT AWAY: the page's start
  // script fires the first request BEFORE this component mounts, so
  // the bar may already have moved by the time the component first
  // paints. starting at zero would show a dark bar for one frame and
  // then jump, which reads as a glitch.
  const [progress, set_progress] = use_state(
    HUGGIES_LOADING_BAR.get_progress(),
  );

  // --- WHY THE PATCH IS NOT INSTALLED HERE: the module installs
  // itself when it is imported, and the page's start script calls it
  // before the page fires its first request. installing it in this
  // effect would be too late — the first request would already be
  // flying and would never be counted.
  use_effect(() => {
    return HUGGIES_LOADING_BAR.subscribe(() => {
      set_progress(HUGGIES_LOADING_BAR.get_progress());
    });
  }, []);

  const percent = `${Math.round(progress * 100)}%`;

  return (
    // --- WHY THE FILL IS THE ROOT AND NOT WRAPPED: the mount div
    // (#HUGGIES_COMPONENT_LOADING_BAR) IS the track. the css gives IT
    // the height, the position and the dark background. when the
    // component rendered its own wrapper div inside it, that wrapper
    // had no height of its own and collapsed to zero — so the fill's
    // "height: 100%" resolved against a zero-height parent and the
    // fill was invisible. the fill must be a direct child of the
    // track.
    <div
      class="loading-bar-fill"
      role="progressbar"
      aria-label="loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      style={{ width: percent }}
    />
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
