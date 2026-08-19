//! huggies_rex_rhea_contract_id_const
//!
//! Contract id for the rhea / ref-finance DEX on the configured network.
// =========================================
use near_kit::types::AccountId;
// =========================================
/// Rhea / ref-finance DEX contract id on mainnet.
pub const RHEA_CONTRACT_ID: &str = "v2.ref-finance.near";
// =========================================
/// Returns the rhea contract id as an `AccountId`.
pub fn rhea_contract_account_id() -> AccountId {
    RHEA_CONTRACT_ID
        .parse()
        .expect("RHEA_CONTRACT_ID is a hardcoded valid account id")
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
