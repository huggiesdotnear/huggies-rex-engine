//! huggies_rex_vault_write_json_fun
//!
//! Atomically write a JSON file to the vault by writing to a temp file
//! next to the target and renaming.
// =========================================
use std::fs;
use std::io::Write;
use std::path::Path;
// =========================================
pub fn huggies_rex_vault_write_json_fun<T: serde::Serialize>(file_path: &Path, value: &T) {
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).expect("failed to create vault directory");
    }
    let tmp = file_path.with_extension("json.tmp");
    let bytes = serde_json::to_vec_pretty(value).expect("failed to serialize vault json");
    {
        let mut f = fs::File::create(&tmp).expect("failed to create temp vault file");
        f.write_all(&bytes)
            .expect("failed to write temp vault file");
        f.sync_all().expect("failed to fsync temp vault file");
    }
    fs::rename(&tmp, file_path).expect("failed to rename temp vault file");
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
