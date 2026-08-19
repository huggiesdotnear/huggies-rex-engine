//! huggies_rex_vault_const
//!
//! Vault file names used inside the per-user vault directory.
// =========================================
pub const VAULT_DB_FILE_NAME: &str = "cache.sqlite";
pub const VAULT_WATCHLIST_FILE_NAME: &str = "watchlist.json";
pub const VAULT_FOLLOWS_FILE_NAME: &str = "follows.json";
pub const VAULT_TRADES_FILE_NAME: &str = "trades.json";
// =========================================
pub const VAULT_CONST_TYPE: VAULT_CONST_TYPE = VAULT_CONST_TYPE {
    db_file_name: VAULT_DB_FILE_NAME,
    watchlist_file_name: VAULT_WATCHLIST_FILE_NAME,
    follows_file_name: VAULT_FOLLOWS_FILE_NAME,
    trades_file_name: VAULT_TRADES_FILE_NAME,
};
// =========================================
pub struct VAULT_CONST_TYPE {
    pub db_file_name: &'static str,
    pub watchlist_file_name: &'static str,
    pub follows_file_name: &'static str,
    pub trades_file_name: &'static str,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
