// ========================================
// the swap page's ONE entry: the page's html loads this file and
// nothing else.
//
// the order below IS the page's order of life, and it matters:
//
// 1. import-app-wide brings the network pin (hello.ts) and the
//    app-wide components.
// 2. the start begins the page's load, before any component mounts.
// 3. the components mount last and read what the load brought back.
//
// --- WHY --- the app-wide ones (the nav, the auth button, the loading
// bar) come with import-app-wide. the toast layer does NOT: the layer
// is mounted by the pages that have something to report, and the swap
// page is one of them.
import "./import-app-wide";
import "./swap/app_page_swap_start";
import "../components/swap/app_page_swap_form";
import "../components/swap/app_page_swap_routes";
import "../components/shared/token_picker";
import "../components/shared/toast_layer";
// ========================================
// copyright 2026 by sleet.near
// ========================================
