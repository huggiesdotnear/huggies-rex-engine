// HUGGIES_PORT_FUN
// bind port, default 54733.
// ====================================
pub fn huggies_port_fun() -> u16 {
    std::env::var("HUGGIES_PORT")
        .ok()
        .and_then(|v| v.parse::<u16>().ok())
        .unwrap_or(54733)
}
// ====================================
// copyright 2026 by sleet.near
