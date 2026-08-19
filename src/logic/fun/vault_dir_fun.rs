//! huggies_rex_vault_dir_fun
//!
//! Resolve the user vault directory and ensure it exists.
// =========================================
use std::fs;
use std::path::PathBuf;
// =========================================
pub fn huggies_rex_vault_dir_fun(vault_dir: &str) -> PathBuf {
    let path = PathBuf::from(vault_dir);
    if !path.exists() {
        fs::create_dir_all(&path).expect("failed to create vault directory");
    }
    path
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
