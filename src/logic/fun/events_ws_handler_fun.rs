//! huggies_rex_events_ws_handler_fun
//!
//! Minimal serde model for the events we care about. The intear
//! `events.intear.tech` WebSocket emits JSON whose layout matches the
//! types in `intear-events`. We mirror only the fields we need.
//!
//! All `*_amount` and `*_timestamp_nanosec` fields are stringified
//! decimals on the wire, so they go through `dec_format`-style helpers
//! from `serde`.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TRADE_POOL_EVENT_TYPE {
    pub pool: String,
    pub token_in: String,
    pub token_out: String,
    #[serde(with = "dec_string")]
    pub amount_in: u128,
    #[serde(with = "dec_string")]
    pub amount_out: u128,
    pub trader: String,
    pub block_height: u64,
    #[serde(with = "dec_string")]
    pub block_timestamp_nanosec: u128,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TRADE_SWAP_EVENT_TYPE {
    pub trader: String,
    pub block_height: u64,
    #[serde(with = "dec_string")]
    pub block_timestamp_nanosec: u128,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct REF_SIMPLE_POOL_CHANGE_TYPE {
    pub token_account_ids: Vec<String>,
    #[serde(with = "dec_string_vec")]
    pub amounts: Vec<u128>,
    pub total_fee: u32,
    pub exchange_fee: u32,
    pub referral_fee: u32,
    #[serde(with = "dec_string")]
    pub shares_total_supply: u128,
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum REF_POOL_CHANGE_TYPE {
    SimplePool(REF_SIMPLE_POOL_CHANGE_TYPE),
    StableSwapPool {
        token_account_ids: Vec<String>,
        token_decimals: Vec<u8>,
        #[serde(with = "dec_string_vec")]
        c_amounts: Vec<u128>,
        total_fee: u32,
    },
    RatedSwapPool {
        token_account_ids: Vec<String>,
        token_decimals: Vec<u8>,
        #[serde(with = "dec_string_vec")]
        c_amounts: Vec<u128>,
        total_fee: u32,
    },
    DegenSwapPool {
        token_account_ids: Vec<String>,
        token_decimals: Vec<u8>,
        #[serde(with = "dec_string_vec")]
        c_amounts: Vec<u128>,
        total_fee: u32,
    },
}
// =========================================
/// Outer wrapping from the events API: each `pool` field is one of
/// `{"Ref": <ref-pool>}`, `{"Aidols": <aidols-pool>}`,
/// `{"IntearPlach": <intear-plach-pool>}` (PascalCase external tag,
/// the default). We only model `Ref`; the others round-trip as
/// `serde_json::Value` and we just drop the event.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum POOL_TYPE_WRAPPER_TYPE {
    Ref(REF_POOL_CHANGE_TYPE),
    Aidols(serde_json::Value),
    IntearPlach(serde_json::Value),
}
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TRADE_POOL_CHANGE_EVENT_TYPE {
    pub pool_id: String,
    pub receipt_id: String,
    pub pool: POOL_TYPE_WRAPPER_TYPE,
    pub block_height: u64,
    #[serde(with = "dec_string")]
    pub block_timestamp_nanosec: u128,
}
// =========================================
mod dec_string {
    use serde::{Deserialize, Deserializer, Serializer};
    use std::str::FromStr;
    pub fn serialize<S: Serializer>(value: &u128, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&value.to_string())
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<u128, D::Error> {
        let s = String::deserialize(d)?;
        u128::from_str(&s).map_err(serde::de::Error::custom)
    }
}
// =========================================
mod dec_string_vec {
    use serde::{Deserialize, Deserializer, Serializer};
    use std::str::FromStr;
    pub fn serialize<S: Serializer>(value: &Vec<u128>, s: S) -> Result<S::Ok, S::Error> {
        let strs: Vec<String> = value.iter().map(|v| v.to_string()).collect();
        s.serialize_some(&strs)
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<u128>, D::Error> {
        let strs: Vec<String> = Vec::deserialize(d)?;
        strs.into_iter()
            .map(|s| u128::from_str(&s).map_err(serde::de::Error::custom))
            .collect()
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
