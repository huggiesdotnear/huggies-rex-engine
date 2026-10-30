// ========================================
// single TS file allowed to import from frontend/lib/components/*
// (AGENTS.md). every app/* page loads it as a <script> tag; the
// component self-mount blocks fire only on pages that declare the
// matching id, so side-effect imports here are no-ops elsewhere.
// ========================================

// pin the network to mainnet before anything reads it.
// --- WHY --- this app is mainnet-only. the pin has to happen before
// the first near_connect_client() call, and some pages load
// app_page_account_route.ts (which inits auth) ahead of this file.
// the pages under app/contract/ and app/token/ do not load
// hello.ts themselves, so it is imported here for them.
import "./hello";
import "../components/nav";
import "../components/random_slogan_p";
import "../components/auth_button";
import "../components/app_page_account_id_h1";
import "../components/app_page_account_direct_balance_table";
import "../components/app_page_account_rhea_amm_balance_table";
import "../components/app_page_account_rhea_dcl_balance_table";
import "../components/app_page_account_intear_balance_table";
import "../components/contract_page_rhea_header";
import "../components/contract_page_rhea_pools";
import "../components/contract_page_intear_dex_header";
import "../components/contract_page_intear_dex_pools";
import "../components/contract_page_sputnik_dao_selector";
import "../components/contract_page_sputnik_dao_header";
import "../components/contract_page_sputnik_dao_roles";
import "../components/contract_page_sputnik_dao_proposals";
import "../components/contract_page_sputnik_dao_balances";
import "../components/contract_page_pumpopoly_account_selector";
import "../components/contract_page_pumpopoly_player_stats";
import "../components/contract_page_pumpopoly_nft_list";
import "../components/contract_page_pumpopoly_invite";
import "../components/app_page_discover_contract_discover";
import "../components/app_page_discover_token_discover";
import "../components/token_page_token_selector";
import "../components/token_page_token_detail";
import "../components/token_page_token_holders";
import "../components/token_page_token_status";
import "../components/app_page_game_emoji_match_game";
import "../components/app_page_game_meme_tokens";
import "../components/app_page_discover_quick_links";
import "../components/app_page_burn_addresses";
import "../components/app_page_burn_balances";
import "../components/app_page_burn_info";
import "../components/token_page_shit_1170_page_link";
import "../components/shared/sort_control";
import "../components/shared/sort_keys_control";
import "../components/token_page_shit_1170_status";
import "../components/token_page_shit_1170_header";
import "../components/token_page_shit_1170_groups";
import "../components/token_page_shit_1170_filters";
import "../components/token_page_shit_1170_holders";
import "../components/token_page_shit_1170_metadata";
import "../components/shared/token_meta_grid";
// ========================================
