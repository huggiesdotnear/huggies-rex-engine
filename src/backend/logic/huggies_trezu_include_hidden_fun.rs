// HUGGIES_TREZU_INCLUDE_HIDDEN_FUN
// normalize the `includeHidden` query param of the treasuries proxy.
//
// only the literal "true" turns hidden treasuries on; anything else
// (including a missing param) means false. trezu parses this as a
// bool, so we forward it as a clean "true"/"false" string.
// ====================================
pub fn huggies_trezu_include_hidden_fun(raw: Option<&str>) -> bool {
    matches!(raw.map(str::trim), Some("true"))
}
// ====================================
// copyright 2026 by sleet.near
