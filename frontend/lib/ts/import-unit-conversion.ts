// ========================================
// the unit conversion page's ONE entry: the page's html loads this file and
// nothing else.
//
// the order below IS the page's order of life, and it matters:
//
// 1. import-app-wide brings the network pin (hello.ts) and the
//    app-wide components.
// 2. the start begins the page's load, before any component mounts.
// 3. the components mount last and read what the load brought back.
//
// --- WHY --- the token picker rides along: the page picks ONE token,
// and the picker it uses is the shared token picker — it opens over
// the page the same way it opens over the swap form.
import "./import-app-wide";
import "./unit-conversion/app_page_unit_conversion_start";
import "../components/unit-conversion/app_page_unit_conversion_form";
import "../components/shared/token_picker";
// ========================================
// copyright 2026 by sleet.near
// ========================================
