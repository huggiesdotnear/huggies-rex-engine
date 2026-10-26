// ========================================
// single TS file allowed to import from frontend/lib/components/*
// (AGENTS.md). every app/* page loads it as a <script> tag; the
// component self-mount blocks fire only on pages that declare the
// matching id, so side-effect imports here are no-ops elsewhere.
// ========================================

// pin the network to mainnet before anything reads it.
// --- WHY --- this app is mainnet-only. the pin has to happen before
// the first near_connect_client() call, and some pages load
// account_route.ts (which inits auth) ahead of this file.
import "./network";
import "../components/nav";
import "../components/random_slogan_p";
import "../components/auth_button";
import "../components/account_id_h1";
import "../components/account_direct_balance_table";
import "../components/rhea_amm_balance_table";
import "../components/account_rhea_dcl_balance_table";
import "../components/account_intear_balance_table";
import "../components/contract_rhea_amm_page";
import "../components/contract_rhea_dcl_v2_page";
import "../components/contract_intear_dex_page";
import "../components/contract_sputnik_dao_page";
import "../components/contract_pumpopoly_page";
import "../components/contract_discover";
import "../components/token_discover";
import "../components/token_detail_page";
import "../components/emoji_match_game";
import "../components/game_link";
import "../components/shit_link";
import "../components/sort_control";
import "../components/shit_1170_page";
// ========================================
