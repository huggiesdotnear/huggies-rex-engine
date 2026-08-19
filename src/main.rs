// =========================================
use anyhow::Result;
use tracing_subscriber::EnvFilter;

use huggies_rex_engine::logic::constants::trading_const::DEFAULT_TRADER_ACCOUNT_ID;
use huggies_rex_engine::logic::fun::bootstrap_state_fun::{
    huggies_rex_bootstrap_state_fun, huggies_rex_run_server_fun,
};
use huggies_rex_engine::logic::fun::vault_location::huggies_rex_vault_location;
// =========================================
#[tokio::main]
async fn main() -> Result<()> {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();
    let signer_account_id = std::env::var("HUGGIES_REX_SIGNER_ACCOUNT_ID")
        .unwrap_or_else(|_| DEFAULT_TRADER_ACCOUNT_ID.to_string());
    let vault_dir = huggies_rex_vault_location();
    let bind =
        std::env::var("HUGGIES_REX_BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".to_string());
    tracing::info!(%bind, %vault_dir, %signer_account_id, "huggies-rex: booting");
    let state = huggies_rex_bootstrap_state_fun(&vault_dir, &signer_account_id).await?;
    huggies_rex_run_server_fun(state, &bind).await
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
