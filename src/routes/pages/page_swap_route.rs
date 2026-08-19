//! huggies_rex_page_swap_route
//!
//! `/swap` redirects to `/` (the home page is the swap page now).
// =========================================
use axum::response::Redirect;
// =========================================
pub async fn huggies_rex_page_swap_route() -> Redirect {
    Redirect::permanent("/")
}
// =========================================
// =========================================
// copyright 2026 by sleet.near
