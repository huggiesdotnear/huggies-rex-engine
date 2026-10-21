// ========================================
// single TS file allowed to import from frontend/lib/components/*
// (AGENTS.md). every app/* page loads it as a <script> tag; the
// component self-mount blocks fire only on pages that declare the
// matching id, so side-effect imports here are no-ops elsewhere.
// ========================================

import "../components/nav";
import "../components/random_slogan_p";
import "../components/network_button";
import "../components/auth_button";
import "../components/account_id_h1";
import "../components/account_direct_balance_table";
import "../components/rhea_deposit_table";
// ========================================
