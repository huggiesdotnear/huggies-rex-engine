// ========================================
// the account page's ONE entry: the page's html loads this file and
// nothing else.
//
// the order below IS the page's order of life, and it matters:
//
// 1. import-app-wide brings the network pin (hello.ts) and the
//    app-wide components. the pin has to land before anything reads
//    the network.
// 2. the route decides WHICH account the page shows. it calls the
//    wallet, so it reads the network.
// 3. the start begins the page's load, before any component mounts.
// 4. the components mount last and read what the load brought back.
import "./import-app-wide";
import "./account/app_page_account_route";
import "./account/app_page_account_start";
import "../components/account/app_page_account_id_h1";
import "../components/account/app_page_account_tabs";
import "../components/account/app_page_account_direct_balance_table";
import "../components/account/app_page_account_rhea_amm_balance_table";
import "../components/account/app_page_account_rhea_dcl_balance_table";
import "../components/account/app_page_account_intear_balance_table";
import "../components/account/app_page_account_tx_cards";
import "../components/account/app_page_account_transactions_table";
// ========================================
// copyright 2026 by sleet.near
// ========================================
