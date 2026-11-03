// ========================================
// the skill page's ONE entry: the page's html loads this file and
// nothing else.
//
// the skill page carries the app-wide three and its own session
// management card.
//
// the order below IS the page's order of life: the network pin and the
// app-wide components come first, the page's own start comes next, and
// the page's own components mount last.
import "./import-app-wide";
import "./skill/app_page_skill_start";
import "../components/skill/app_page_skill_session";
// ========================================
// copyright 2026 by sleet.near
// ========================================
