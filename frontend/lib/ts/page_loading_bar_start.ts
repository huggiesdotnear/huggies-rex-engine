// ========================================
// the one thing every page's start script does first: put the loading
// bar's patch on the global fetch BEFORE the page fires its first
// request.
//
// --- WHY THIS IS ITS OWN FILE: a page's html loads its start script
// BEFORE the shared import that brings the bar's component in. so the
// patch on the global fetch has to be in place before the start
// script's own load runs, or the page's FIRST load is never counted
// and the bar sits dark through it.
//
// --- WHY IT IS A FUNCTION AND NOT A BARE IMPORT: a bare import can
// be dropped by the bundler when nothing uses what it exports. a
// function call cannot, so the import always survives.
//
// --- WHY EVERY START SCRIPT CALLS THIS: the start script is the page's
// first action, and this is the first action in it. one line per page
// is the whole cost, and it is the same line everywhere.
//
// --- WHY IT CALLS install() WHEN THE MODULE ALREADY INSTALLED ITSELF:
// the module installs itself when it is imported, so this call is a
// no-op. it is here because it makes the ORDERING explicit — the patch
// is in place BEFORE the page's load, not merely by the time the
// component mounts — and a call cannot be dropped by the bundler the
// way an unused import can.
import { HUGGIES_LOADING_BAR } from "./loading_bar";
// ========================================
// ========================================
// --- START -----------------------------
export function huggies_loading_bar_start_fun(): void {
  HUGGIES_LOADING_BAR.install();
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
