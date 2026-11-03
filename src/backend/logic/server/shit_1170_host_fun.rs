// SHIT_1170_HOST_FUN
// bind host, default 0.0.0.0.
// ====================================
pub fn shit_1170_host_fun() -> String {
    std::env::var("SHIT_1170_HOST")
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| "0.0.0.0".to_string())
}
// ====================================
// copyright 2026 by sleet.near
