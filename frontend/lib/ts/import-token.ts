// ========================================
// the token page's ONE entry: the page's html loads this file and
// nothing else.
//
// the order below IS the page's order of life, and it matters:
//
// 1. import-app-wide brings the network pin (hello.ts) and the
//    app-wide components.
// 2. the start begins the page's load, before any component mounts.
// 3. the components mount last and read what the load brought back.
//
// --- WHY --- the $SHIT page link is here and not on the $SHIT page:
// the link is the way back to the $SHIT page, and it sits on the token
// page because that is the page a reader is on when they want to get
// to it. the css says the same (import-token.css carries the link's
// css) — the two files list the same components, in the same order.
import "./import-app-wide";
import "./token/index/token_page_token_start";
import "../components/token/index/token_page_token_status";
import "../components/token/index/token_page_token_selector";
import "../components/token/index/token_page_token_detail";
import "../components/token/index/token_page_token_holders";
import "../components/token/shit-1170/token_page_shit_1170_page_link";
// ========================================
// copyright 2026 by sleet.near
// ========================================
