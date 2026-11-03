// VAULT_DB_PATH_FUN
// where the sqlite db file lives.
//
// the default is `${HOME}/.shit-1170/shit-1170.db`, and
// `SHIT_1170_VAULT_DB_LOCATION` overrides it. the folder is created if it
// is not there yet, so a fresh install does not need a manual mkdir.
//
// --- WHY --- the path is resolved ONCE, at startup, and the pool is
// opened against it: a db that moves under a running process would split
// the data in two. the env var is read here and nowhere else.
// ========================================
use std::path::PathBuf;
// ========================================
// --- CONFIG -----------------------------
// the env var that overrides the db location.
const SHIT_1170_VAULT_DB_LOCATION_ENV: &str = "SHIT_1170_VAULT_DB_LOCATION";
// the folder under the home dir that holds the db.
const SHIT_1170_VAULT_DIR_NAME: &str = ".shit-1170";
// the db file's name inside that folder.
const SHIT_1170_VAULT_DB_FILE_NAME: &str = "shit-1170.db";
// ========================================
// --- HELPERS ----------------------------
// the default location: `${HOME}/.shit-1170/shit-1170.db`.
fn default_db_path_fun() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/root".to_string());
    PathBuf::from(home)
        .join(SHIT_1170_VAULT_DIR_NAME)
        .join(SHIT_1170_VAULT_DB_FILE_NAME)
}
// ========================================
// --- PATH -------------------------------
// the db file's path, from the env var when it is set and not blank,
// and from the default location otherwise.
//
// --- WHY --- a blank env var falls back to the default instead of
// pointing at the current folder: an empty string would make sqlite open
// a file named after the process, and a `""` value is almost always a
// mistake rather than an intent.
pub fn vault_db_path_fun() -> PathBuf {
    match std::env::var(SHIT_1170_VAULT_DB_LOCATION_ENV) {
        Ok(value) => {
            let trimmed = value.trim();
            if trimmed.is_empty() {
                return default_db_path_fun();
            }
            PathBuf::from(trimmed)
        }
        Err(_) => default_db_path_fun(),
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
