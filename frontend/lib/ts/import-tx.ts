// ========================================
// the transaction page's ONE entry: the page's html loads this file
// and nothing else.
//
// the order below IS the page's order of life, and it matters:
//
// 1. import-app-wide brings the network pin (hello.ts) and the
//    app-wide components.
// 2. the start begins the page's load, before any component mounts.
// 3. the components mount last and read what the load brought back.
//
// --- WHY --- the code block component is NOT listed here: the code
// block is the tx page's own component, used by the actions component
// and the receipts component. it arrives with the component that uses
// it — it is not a page's own.
import "./import-app-wide";
import "./tx/app_page_tx_start";
import "../components/tx/app_page_tx_status";
import "../components/tx/app_page_tx_summary";
import "../components/tx/widgets/app_page_tx_widget_transfers";
import "../components/tx/widgets/app_page_tx_widget_fastfs";
import "../components/tx/app_page_tx_actions";
import "../components/tx/app_page_tx_receipts";
// ========================================
// copyright 2026 by sleet.near
// ========================================
