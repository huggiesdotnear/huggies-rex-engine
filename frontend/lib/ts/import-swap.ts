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
// bar) come with import-app-wide. the toast layer does NOT: the swap
// is the app's first transaction and the only page with something to
// report, so the layer is the swap page's own.
import "./import-app-wide";
import "./swap/app_page_swap_start";
import "../components/app_page_swap_form";
import "../components/app_page_swap_routes";
import "../components/app_page_swap_token_picker";
import "../components/app_page_swap_toasts";
// ========================================
// copyright 2026 by sleet.near
// ========================================
