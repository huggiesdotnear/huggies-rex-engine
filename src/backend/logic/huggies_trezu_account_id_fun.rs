// HUGGIES_TREZU_ACCOUNT_ID_FUN
// normalize the `accountId` query param of the treasuries proxy.
//
// trims whitespace and rejects a blank value, because trezu answers a
// missing account with a 400 and we want to fail the same way locally
// instead of burning an upstream request on a guaranteed error.
// ====================================
pub fn huggies_trezu_account_id_fun(raw: Option<&str>) -> Option<String> {
    let trimmed = raw?.trim();
    if trimmed.is_empty() {
        return None;
    }
    Some(trimmed.to_string())
}
// ====================================
// copyright 2026 by sleet.near
