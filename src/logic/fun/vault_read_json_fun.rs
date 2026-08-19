//! huggies_rex_vault_read_json_fun
//!
//! Read a JSON file from the vault, returning the default if it does
//! not exist yet.
// =========================================
use std::fs;
use std::path::Path;
// =========================================
pub fn huggies_rex_vault_read_json_fun<T: serde::de::DeserializeOwned + Default>(
    file_path: &Path,
) -> T {
    if !file_path.exists() {
        return T::default();
    }
    let bytes = fs::read(file_path).expect("failed to read vault json file");
    serde_json::from_slice(&bytes).unwrap_or_default()
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
