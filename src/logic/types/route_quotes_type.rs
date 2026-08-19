//! huggies_rex_route_quotes_type
//!
//! Response shape for `/api/get_return` — every viable swap route from
//! the request token pair, best first.
// =========================================
use serde::{Deserialize, Serialize};

use crate::logic::types::route_quote_type::ROUTE_QUOTE_TYPE;
// =========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ROUTE_QUOTES_TYPE {
    pub token_in: String,
    pub token_out: String,
    pub amount_in: String,
    pub routes: Vec<ROUTE_QUOTE_TYPE>,
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
