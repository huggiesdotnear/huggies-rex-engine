// ========================================
// the queue page's ONE entry: the page's html loads this file and
// nothing else.
//
// the order below IS the page's order of life: the network pin and the
// app-wide components come first, the page's start fires its first
// request, and the page's own components mount last and read what the
// load brought back.
import "./import-app-wide";
import "./queue/app_page_queue_start";
import "../components/queue/app_page_queue_status";
import "../components/queue/app_page_queue_summary";
import "../components/queue/app_page_queue_transactions";
import "../components/queue/app_page_queue_transfers";
import "../components/queue/app_page_queue_accounts";
import "../components/queue/app_page_queue_actions";
import "../components/shared/toast_layer";
// ========================================
// copyright 2026 by sleet.near
// ========================================
