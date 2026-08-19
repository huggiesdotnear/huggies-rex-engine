//! huggies_rex_token_amount_type
//!
//! Strongly-typed wrapper for a raw token amount plus the decimals
//! needed to render it as a human-readable string. Every display
//! path should carry one of these rather than a bare `String` or `u128`
//! so the right decimals are always used.
// =========================================
use serde::{Deserialize, Serialize};
// =========================================
/// Raw token amount (in the token's smallest unit, e.g. yoctoNEAR)
/// together with the decimals needed to render it. Use
/// `TokenAmount::raw(raw_string_or_number, decimals)` to build one
/// from a contract view; the raw value is always stored as a `String`
/// because u128 doesn't fit in JSON numbers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TOKEN_AMOUNT_TYPE {
    /// Raw amount as a decimal string (matches the on-wire JSON form
    /// from rhea / NEP-141 view calls).
    pub raw: String,
    /// Number of decimal places for the token. None means the value
    /// is opaque (e.g. LP share MFTs without a public metadata view).
    pub decimals: Option<u8>,
    /// Optional symbol for display. None falls back to the token
    /// account id's first segment.
    pub symbol: Option<String>,
}
// =========================================
impl TOKEN_AMOUNT_TYPE {
    pub fn new(raw: impl Into<String>, decimals: Option<u8>, symbol: Option<String>) -> Self {
        Self {
            raw: raw.into(),
            decimals,
            symbol,
        }
    }
    /// Render as a human-readable decimal string. If `decimals` is
    /// `None`, falls back to the raw value (the caller didn't know
    /// the decimals, so we can't safely format).
    pub fn human(&self) -> String {
        format_amount(&self.raw, self.decimals)
    }
}
// =========================================
pub fn format_amount(raw: &str, decimals: Option<u8>) -> String {
    let dec = match decimals {
        Some(d) => d,
        None => return raw.to_string(),
    };
    if dec == 0 {
        return raw.to_string();
    }
    // parse as u128 to avoid float precision loss on large values
    let parsed: u128 = match raw.parse() {
        Ok(v) => v,
        Err(_) => return raw.to_string(),
    };
    let denom = 10u128.pow(dec as u32);
    let whole = parsed / denom;
    let frac = parsed % denom;
    if frac == 0 {
        return whole.to_string();
    }
    let frac_str = format!("{:0>width$}", frac, width = dec as usize);
    let trimmed = frac_str.trim_end_matches('0');
    if trimmed.is_empty() {
        whole.to_string()
    } else {
        format!("{whole}.{trimmed}")
    }
}
// =========================================
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn format_24_decimals() {
        // 5 NEAR = 5 * 10^24 yoctoNEAR
        let amt = TOKEN_AMOUNT_TYPE::new("5000000000000000000000000", Some(24), None);
        assert_eq!(amt.human(), "5");
    }
    #[test]
    fn format_6_decimals_fractional() {
        // 1.5 USDT = 1500000 (USDT has 6 decimals)
        let amt = TOKEN_AMOUNT_TYPE::new("1500000", Some(6), Some("USDT".into()));
        assert_eq!(amt.human(), "1.5");
    }
    #[test]
    fn format_no_decimals_passthrough() {
        let amt = TOKEN_AMOUNT_TYPE::new("12345", None, None);
        assert_eq!(amt.human(), "12345");
    }
    #[test]
    fn format_trims_trailing_zeros() {
        let amt = TOKEN_AMOUNT_TYPE::new("1000000", Some(6), None);
        assert_eq!(amt.human(), "1");
        let amt = TOKEN_AMOUNT_TYPE::new("1100000", Some(6), None);
        assert_eq!(amt.human(), "1.1");
    }
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
