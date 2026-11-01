// ========================================
// the transaction page's components: the status line, the summary, the
// transfers, the actions and the receipts.
//
// --- WHY --- THE CODE BLOCK COMPONENT IS NOT LISTED HERE: the code
// block is a shared component that the actions component and the
// receipts component both pull in for themselves. a shared component
// arrives with the component that uses it — it is not a page's own.
import "./import-app-wide";
import "../components/app_page_tx_status";
import "../components/app_page_tx_summary";
import "../components/app_page_tx_transfers";
import "../components/app_page_tx_actions";
import "../components/app_page_tx_receipts";
// ========================================
// copyright 2026 by sleet.near
// ========================================
