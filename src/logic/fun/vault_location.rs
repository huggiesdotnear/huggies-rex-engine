//! huggies_rex_vault_location
//!
//! The reason this location is hardcoded is because in production you can
//! mount another location in docker.
// =========================================
use std::env;
// =========================================
pub fn huggies_rex_vault_location() -> String {
    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .unwrap_or_else(|_| ".".to_string());

    format!("{home}/.huggies-rex-vault")
}
// =========================================
