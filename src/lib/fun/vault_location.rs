use std::env;
// =========================================
// huggies_rex_vault_location
// the reason this location is hardcode
// is becuase in production you can mount another location in docker
// =========================================
pub fn huggies_rex_vault_location() -> String {
    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .unwrap_or_else(|_| ".".to_string());

    format!("{home}/.huggies-rex-vault")
}
// =========================================
