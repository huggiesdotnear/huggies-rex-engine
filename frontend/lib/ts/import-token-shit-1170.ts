// ========================================
// the $SHIT page's ONE entry: the page's html loads this file and
// nothing else.
//
// the order below IS the page's order of life, and it matters:
//
// 1. import-app-wide brings the network pin (hello.ts) and the
//    app-wide components.
// 2. the start begins the page's load, before any component mounts.
// 3. the components mount last and read what the load brought back.
import "./import-app-wide";
import "./token/shit-1170/token_page_shit_1170_start";
import "../components/token/shit-1170/token_page_shit_1170_status";
import "../components/token/shit-1170/token_page_shit_1170_header";
import "../components/token/shit-1170/token_page_shit_1170_groups";
import "../components/token/shit-1170/token_page_shit_1170_filters";
import "../components/token/shit-1170/token_page_shit_1170_holders";
import "../components/token/shit-1170/token_page_shit_1170_metadata";
// ========================================
// copyright 2026 by sleet.near
// ========================================
